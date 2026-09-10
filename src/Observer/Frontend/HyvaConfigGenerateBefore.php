<?php

/**
 * Copyright © W. Poortman 2021-present. All rights reserved.
 *
 * Please read the README and LICENSE files for more
 * details on copyrights and license information.
 */

declare(strict_types=1);

namespace Magewirephp\MagewireHyvaTheme\Observer\Frontend;

use Magento\Framework\Component\ComponentRegistrar;
use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;

class HyvaConfigGenerateBefore implements ObserverInterface
{
    protected ComponentRegistrar $componentRegistrar;

    /**
     * @param ComponentRegistrar $componentRegistrar
     */
    function __construct(ComponentRegistrar $componentRegistrar)
    {
        $this->componentRegistrar = $componentRegistrar;
    }

    function execute(Observer $event)
    {
        $config = $event->getData('config');
        $extensions = $config->hasData('extensions') ? $config->getData('extensions') : [];
        $path = $this->componentRegistrar->getPath(
            ComponentRegistrar::MODULE,
            'Magewirephp_MagewireHyvaTheme'
        );
        $extension = ['src' => substr($path, strlen(BP) + 1)];

        if (! in_array($extension, $extensions, true)) {
            $extensions[] = $extension;
        }

        $config->setData('extensions', $extensions);
    }
}
