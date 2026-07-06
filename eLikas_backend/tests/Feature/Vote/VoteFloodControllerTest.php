<?php

use App\Models\FloodLevel;
use App\Models\FloodPath;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\User;
use App\Models\UserAuth;
use App\Models\Vote;
use MatanYadaev\EloquentSpatial\Objects\Point;

function voteUser(): User
{
    $uid = env('FIREBASE_TEST_VERIFIED_UID');

    $auth = UserAuth::with('user')
        ->where('identity_uid', $uid)
        ->first();

    if (! $auth || ! $auth->user) {
        test()->fail("No user found for {$uid}");
    }

    return $auth->user;
}


// TEST 1
test('user can upvote flood path', function () {

    $token = individualToken();

    $user = voteUser();

    $path = createFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote' => 1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes' => 1,
        'downvotes' => 0,
    ]);

    $this->assertDatabaseHas('Votes',[
        'user_id' => $user->id,
        'element_id' => $path->element_id,
        'vote' => 1,
    ]);
});


// TEST 2
test('user can downvote flood path', function () {

    $token = individualToken();

    $user = voteUser();

    $path = createFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote' => -1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes' => 0,
        'downvotes' => 1,
    ]);

    $this->assertDatabaseHas('Votes',[
        'user_id' => $user->id,
        'element_id' => $path->element_id,
        'vote' => -1,
    ]);
});


// TEST 3.1
test('sending same upvote removes vote', function () {

    $token = individualToken();

    $user = voteUser();

    $path = createFloodPath($user);

    $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote'=>1,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote'=>1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes'=>0,
        'downvotes'=>0,
    ]);

    $this->assertDatabaseMissing('Votes',[
        'user_id'=>$user->id,
        'element_id'=>$path->element_id,
    ]);
});


// TEST 3.2
test('sending same downvote removes vote', function () {

    $token = individualToken();

    $user = voteUser();

    $path = createFloodPath($user);

    $this->withHeaders([
        'Authorization'=>"Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote'=>-1,
    ]);

    $response=$this->withHeaders([
        'Authorization'=>"Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote'=>-1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes'=>0,
        'downvotes'=>0,
    ]);

    $this->assertDatabaseMissing('Votes',[
        'user_id'=>$user->id,
        'element_id'=>$path->element_id,
    ]);
});


// TEST 4.1
test('user can switch from upvote to downvote', function () {

    $token = individualToken();

    $user = voteUser();

    $path = createFloodPath($user);

    $this->withHeaders([
        'Authorization'=>"Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote'=>1,
    ]);

    $response=$this->withHeaders([
        'Authorization'=>"Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote'=>-1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes'=>0,
        'downvotes'=>1,
    ]);

    $this->assertDatabaseHas('Votes',[
        'user_id'=>$user->id,
        'element_id'=>$path->element_id,
        'vote'=>-1,
    ]);
});


// TEST 4.2
test('user can switch from downvote to upvote', function () {

    $token = individualToken();

    $user = voteUser();

    $path = createFloodPath($user);

    $this->withHeaders([
        'Authorization'=>"Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote'=>-1,
    ]);

    $response=$this->withHeaders([
        'Authorization'=>"Bearer {$token}",
    ])->postJson("/api/flood-paths/{$path->id}/vote",[
        'vote'=>1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes'=>1,
        'downvotes'=>0,
    ]);

    $this->assertDatabaseHas('Votes',[
        'user_id'=>$user->id,
        'element_id'=>$path->element_id,
        'vote'=>1,
    ]);
});


// Test 5
test('flood path vote requires authentication', function () {

    $user = voteUser();

    $path = createFloodPath($user);

    $response = $this->postJson("/api/flood-paths/{$path->id}/vote", [
        'vote' => 1,
    ]);

    $response->assertStatus(401);
});
