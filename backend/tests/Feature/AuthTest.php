<?php

namespace Tests\Feature;

use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_login_endpoint_exists()
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422);
    }

    public function test_register_endpoint_exists()
    {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422);
    }
}