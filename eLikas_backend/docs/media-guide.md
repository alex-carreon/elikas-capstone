# eLikas Media System — Developer Guide

## How It Works (Overview)

```
User uploads image (JPG / PNG / HEIC)
    → Laravel validates the file
    → MediaUploadService re-encodes it to JPEG at max 1280px
    → File is written to the nginx media server over SFTP (via Tailscale)
    → A MediaFile record is created in the database with the relative path
    → has_media is set to true on the parent SocialElement
```

Media is never stored on the Laravel server itself. It lives on the
dedicated nginx media server and is served publicly from there.

`Intervention Image` is the key PHP library that handles image processing. In this project
it does three things to every uploaded file:
 
1. Decodes the upload - It reads the raw uploaded file regardless of what format it came in.
 
2. The library checks the photo then shrinks the longest side to a maximum of 1280px to scale it down 
when necesssary while keeping the original proportions.
 
3. Re-encodes to JPEG - By doing this, the file is sanitized and compressed for efficiency. 
Additionally, it normalizes file structure in the media server.
 
The result is a binary string of image data, ready to be written to storage.

`SFTP (SSH File Transfer Protocol)` is a way to transfer files securely between
two machines over a network. It runs on top of SSH, the same protocol used
to log into a remote server via the terminal.
 
Since Laravel and the nginx media server are two separate machines in this project, 
SFTP is the transports files as necessary through the Tailscale private network. 
 
Laravel abstracts all of this behind its `Storage` facade. From the application's
perspective, writing a file to the nginx server looks identical to writing a file
locally:
 
```php
Storage::disk('sftp')->put('evac-areas/photo.jpg', $imagedata);
```
 
The SFTP configuration in `config/filesystems.php` handles the connection details
— host IP, username, and the private key used for authentication. No passwords
are involved. Access is controlled entirely by SSH key pairs.
 
 
---

## Local Environment Setup

### 1. Get the deploy private key

Get the private `elikas_media` key file from the team's shared credentials (check docs file).
Place it under this directory in the project:

```
storage/keys/
```

Do not rename or commit this **private** key. It is already in `.gitignore`.

### 2. Set your `.env` values

Fill in the following fields in your `.env` file (correct values in the shared docs file):

```
SFTP_HOST=
SFTP_USERNAME=root
SFTP_PRIVATE_KEY=
SFTP_ROOT=
MEDIA_BASE_URL=
```

### 3. Make sure GD is enabled

Open your `php.ini` file (find its location with `php --ini`) and make
sure this line is uncommented (remove the `;` at the start of the line):

```
extension=gd
```

Restart your development server after changing `php.ini`.

---

## Key Files

| File | Purpose |
|---|---|
| `app/Services/MediaUploadService.php` | Re-encodes and uploads the file, returns relative path |
| `app/Enums/MediaCollection.php` | Valid upload destinations (`EvacAreas`, `FloodReports`, `Comments`) |
| `app/Models/MediaFile.php` | Eloquent model for the `Media` table |
| `config/filesystems.php` | SFTP disk configuration |

---

## MediaCollection Enum

Always use the enum when specifying where a file belongs.
Never pass a raw string to `MediaUploadService::upload()`.

```php
use App\Enums\MediaCollection;

MediaCollection::EvacAreas      // stores in /var/www/uploads/evac-areas/
MediaCollection::FloodReports   // stores in /var/www/uploads/flood-reports/
MediaCollection::Comments       // stores in /var/www/uploads/comments/
```

---

## MediaUploadService

The service should be injected via the controller constructor:

```php
public function __construct(
    protected MediaUploadService $mediaUploadService
) {}
```

Then call it before opening a database transaction:

```php
$uploadedPath = null;

if ($request->hasFile('file')) {
    $uploadedPath = $this->mediaUploadService->upload(
        $request->file('file'),
        MediaCollection::EvacAreas  // use whichever collection is appropriate
    );
}
```

`upload()` returns a relative path string, for example:

```
evac-areas/550e8400-e29b-41d4-a716-446655440000.jpg
```

---

## Creating a MediaFile Record

Do this inside the database transaction, after creating the SocialElement:

```php
if ($uploadedPath) {
    MediaFile::create([
        'parent_id'   => $element->id,   // the SocialElement id
        'user_id'     => $user->id,
        'file_path'   => $uploadedPath,
        'file_type'   => 'jpg',
        'uploaded_at' => now(),
    ]);
}
```

Also set `has_media` on the SocialElement at creation time:

```php
SocialElement::create([
    // ... other fields
    'has_media' => !is_null($uploadedPath),
]);
```

---

## File Upload Validation Rules

Add these to your `$request->validate()` block. Use `nullable` when the
file is optional, `required` when it is mandatory.

```php
// Optional upload (e.g. creating an evac area)
'file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,heic', 'max:8192'],

// Required upload (e.g. standalone media endpoint)
'file' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,heic', 'max:8192'],
```

`max:8192` is 8MB. Accepted formats are JPG, PNG, and HEIC (iPhone photos).
Everything is re-encoded to JPEG internally and the frontend will always receive JPG.

---

## Handling Upload Failures

The upload happens outside the transaction. If the transaction fails after
a successful upload, clean up the orphaned file in the catch block:

```php
} catch (\Exception $e) {
    DB::rollBack();

    if ($uploadedPath) {
        Storage::disk('sftp')->delete($uploadedPath);
    }

    return response()->json([
        'error' => 'Operation failed.',
        'details' => $e->getMessage()
    ], 500);
}
```

---

## Loading Media in API Responses

### Check `has_media` first

`has_media` on `SocialElement` serves as the primary check for loading media. Only query the `Media` table
when you know media exists to avoids unnecessary joins for the majority
of loaded entities that have no photos.

```php
if ($element->has_media) {
    $media = $element->media; // uses the hasMany relationship
}
```

### Eager loading

When building a response that includes media, eager load through the
`socialElement` relationship through:

```php
$pin->load(['socialElement.media']);
```

### Returning media in a response
 
Use this pattern inside your response array. It maps over all media records
belonging to the element and constructs the full public URL for each one.
Returns an empty array when no media exists — the frontend can always safely
iterate over the result without additional null checks.
 
```php
'media' => $pin->social_element?->media->map(function ($media) {
    return [
        'id'   => $media->id,
        'url'  => config('app.media_base_url') . '/' . $media->file_path,
        'type' => $media->file_type,
    ];
})->toArray() ?? [],
```
 
`config('app.media_base_url')` reads from `MEDIA_BASE_URL` in your `.env`.
Make sure there is no trailing slash on that value — a trailing slash
produces a double slash in every URL:
 
```
MEDIA_BASE_URL=http://100.113.43.127/uploads   ← correct
MEDIA_BASE_URL=http://100.113.43.127/uploads/  ← produces double slash
```
 
### Example response shape
 
A pin with one uploaded photo:
 
```json
{
    "id": 1,
    "name": "Barangay Hall",
    "media": [
        {
            "id": 9,
            "url": "http://100.113.43.127/uploads/evac-areas/809f4cc8-7b20-4dfb-9e24-ffb8a4cb05ea.jpg",
            "type": "jpg"
        }
    ]
}
```
 
A pin with no photo returns an empty array — never null:
 
```json
{
    "id": 2,
    "name": "Elementary School",
    "media": []
}
```
 
Multiple photos on the same element follow the same shape — the `media`
array simply contains more entries. The frontend iterates over all of them.

---

## Adding Media to a New Feature

When a new feature needs media support (e.g. comments):

1. Add a case to `app/Enums/MediaCollection.php`:
   ```php
   case Comments = 'comments';
   ```

2. Create the directory on the nginx server (ask Alex for new directories):
   ```
   mkdir -p /var/www/uploads/comments
   ```

3. Inject `MediaUploadService` into the relevant controller and follow
   the same upload-before-transaction pattern shown above.

No other configuration changes are needed.

---

## `DELETE /admin/media`

Deletes a media file from storage and optionally its associated database record. Accepts either `id` *or* `path` as input, but **not both**.

A firebase bearer token with admin role is required for this endpoint.


### Request Body

| Field  | Type    | Required              | Description                        |
|--------|---------|-----------------------|------------------------------------|
| `id`   | numeric | Required if no `path` | ID of the `MediaFile` record       |
| `path` | string  | Required if no `id`   | Raw storage path of the file       |


### Behavior

**When `id` is provided:**
1. Looks up the `MediaFile` record — returns `404` if not found.
2. Deletes the file from storage via `MediaDeleteService`.
3. On success, removes the DB record in a transaction.
4. If no other `MediaFile` records share the same `parent_id`, sets the parent social element's `has_media` to `false`.

**When `path` is provided:**
- Deletes the file directly from storage, no database changes.
- Intended for orphaned files on the media server. 


### Responses

| Status | Description                                          |
|--------|------------------------------------------------------|
| `200`  | File (and record, if applicable) deleted             |
| `404`  | No `MediaFile` record found for the given `id`       |
| `500`  | Storage deletion failed or an unexpected error occurred |

---

## Known Limitations

- Media cannot be edited once uploaded. It can only be removed or added.
- If a flood path or evacuation area is deactivated, its associated media
  files remain on the nginx server. Cleanup is manual for now.
- HEIC support is not yet implemented.
