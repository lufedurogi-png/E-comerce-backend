<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'cva' => [
        'base_url' => env('CVA_BASE_URL', 'https://apicvaservices.grupocva.com/api/v2'),
        'user' => env('CVA_USER'),
        'password' => env('CVA_PASSWORD'),
        'token_ttl_hours' => 12,
        'sync_interval_minutes' => 5,
        'porcentaje_utilidad' => (float) (env('CVA_PORCENTAJE_UTILIDAD', 0)),
        'moneda_pesos' => env('CVA_MONEDA_PESOS', true),
    ],

];
