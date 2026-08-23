<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class FlushApplicationCache extends Command
{
    protected $signature = 'cache:flush-app';

    protected $description = 'Flush the entire application cache (file driver — clears storage/framework/cache/data)';

    public function handle(): int
    {
        Cache::flush();

        $this->info('Application cache flushed.');

        return self::SUCCESS;
    }
}
