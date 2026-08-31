<?php

/**
 * Copyright © Willem Poortman 2021-present. All rights reserved.
 *
 * Please read the README and LICENSE files for more
 * details on copyrights and license information.
 */

declare(strict_types=1);

namespace Magewirephp\MagewireHyvaTheme\Controller\Playwright;

use Magento\Framework\App\Action\HttpGetActionInterface;
use Magewirephp\Magewire\Controller\MagewireDeveloperAction;

class ScriptBootstrap extends MagewireDeveloperAction implements HttpGetActionInterface
{
    protected string $pageTitle = 'Magewire Hyvä / Playwright / Script Bootstrap';
}
