<?php

namespace Tests\Feature;

use Tests\TestCase;

class HewanTest extends TestCase
{
    public function test_data_hewan_requires_login()
    {
        $response = $this->getJson('/api/owner_pet/data_hewan');

        $response->assertStatus(401);
    }
}