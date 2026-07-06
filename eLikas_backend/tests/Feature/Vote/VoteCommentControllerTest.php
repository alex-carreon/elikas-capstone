<?php

use App\Models\User;

// TEST 1
test('user can upvote comment', function () {

    $token = individualToken();

    $user = commentUser();
    $pin = commentEvacPin($user);
    $comment = createComment($user, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => 1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes' => 1,
        'downvotes' => 0,
        'user_vote' => 1,
    ]);

    $this->assertDatabaseHas('Votes', [
        'user_id' => $user->id,
        'element_id' => $comment->element_id,
        'vote' => 1,
    ]);
});


// TEST 2
test('user can downvote comment', function () {

    $token = individualToken();

    $user = commentUser();
    $pin = commentEvacPin($user);
    $comment = createComment($user, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => -1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes' => 0,
        'downvotes' => 1,
        'user_vote' => -1,
    ]);

    $this->assertDatabaseHas('Votes', [
        'user_id' => $user->id,
        'element_id' => $comment->element_id,
        'vote' => -1,
    ]);
});


// TEST 3.1
test('sending same upvote removes comment vote', function () {

    $token = individualToken();

    $user = commentUser();
    $pin = commentEvacPin($user);
    $comment = createComment($user, $pin);

    $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => 1,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => 1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes' => 0,
        'downvotes' => 0,
        'user_vote' => null,
    ]);

    $this->assertDatabaseMissing('Votes', [
        'user_id' => $user->id,
        'element_id' => $comment->element_id,
    ]);
});


// TEST 3.2
test('sending same downvote removes comment vote', function () {

    $token = individualToken();

    $user = commentUser();
    $pin = commentEvacPin($user);
    $comment = createComment($user, $pin);

    $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => -1,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => -1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes' => 0,
        'downvotes' => 0,
        'user_vote' => null,
    ]);

    $this->assertDatabaseMissing('Votes', [
        'user_id' => $user->id,
        'element_id' => $comment->element_id,
    ]);
});


// TEST 4.1
test('user can switch from upvote to downvote on comment', function () {

    $token = individualToken();

    $user = commentUser();
    $pin = commentEvacPin($user);
    $comment = createComment($user, $pin);

    $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => 1,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => -1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes' => 0,
        'downvotes' => 1,
        'user_vote' => -1,
    ]);

    $this->assertDatabaseHas('Votes', [
        'user_id' => $user->id,
        'element_id' => $comment->element_id,
        'vote' => -1,
    ]);
});


// TEST 4.2
test('user can switch from downvote to upvote on comment', function () {

    $token = individualToken();

    $user = commentUser();
    $pin = commentEvacPin($user);
    $comment = createComment($user, $pin);

    $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => -1,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => 1,
    ]);

    $response->assertOk();

    $response->assertJson([
        'upvotes' => 1,
        'downvotes' => 0,
        'user_vote' => 1,
    ]);

    $this->assertDatabaseHas('Votes', [
        'user_id' => $user->id,
        'element_id' => $comment->element_id,
        'vote' => 1,
    ]);
});


// TEST 5
test('comment vote requires authentication', function () {

    $user = commentUser();
    $pin = commentEvacPin($user);
    $comment = createComment($user, $pin);

    $response = $this->postJson("/api/comments/{$comment->id}/vote", [
        'vote' => 1,
    ]);

    $response->assertStatus(401);
});