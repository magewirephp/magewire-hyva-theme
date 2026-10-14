<?php

declare(strict_types=1);

namespace Magewirephp\MagewireHyvaTheme\Tests\Unit\Features;

use Magento\Framework\App\ObjectManager;
use Magento\Framework\ObjectManagerInterface;
use Magewirephp\Magewire\Component;
use Magewirephp\Magewire\Features\SupportEvents\SupportEvents;
use Magewirephp\Magewire\Mechanisms\DataStore;
use Magewirephp\Magewire\Mechanisms\HandleComponents\ComponentContext;
use Magewirephp\Magewire\Mechanisms\HandleComponents\ComponentContext\Effects;
use Magewirephp\Magewire\Mechanisms\HandleComponents\ComponentContext\Memo;
use Magewirephp\MagewireHyvaTheme\Features\SupportMagewireBackwardsCompatibility\SupportEmitUp;
use PHPUnit\Framework\TestCase;
use ReflectionProperty;

class SupportEmitUpTest extends TestCase
{
    private ObjectManagerInterface|null $previousObjectManager = null;

    protected function setUp(): void
    {
        if (! method_exists(Component::class, 'getAncestorEvents')) {
            self::markTestSkipped('Requires a Magewire version that queues emitUp() events (getAncestorEvents()).');
        }

        $this->previousObjectManager = ( new ReflectionProperty(ObjectManager::class, '_instance') )->getValue();

        $dataStore = new DataStore();
        $objectManager = $this->createMock(ObjectManagerInterface::class);
        $objectManager->method('get')->willReturnCallback(static fn ($class) => $class === DataStore::class ? $dataStore : null);

        ObjectManager::setInstance($objectManager);
    }

    protected function tearDown(): void
    {
        if ($this->previousObjectManager !== null) {
            ( new ReflectionProperty(ObjectManager::class, '_instance') )->setValue(null, $this->previousObjectManager);
        }
    }

    public function test_emit_up_sends_its_events_in_the_bc_effect(): void
    {
        $component = new class extends Component {};

        $component->emitUp('child_picked', ['v' => 1]);
        $component->emitToRefreshUp();

        self::assertSame(
            '[{"name":"child_picked","params":{"v":1}},{"name":"$refresh","params":[]}]',
            json_encode($this->dehydrate($component)['ancestorDispatches'])
        );
        self::assertSame([], ( new SupportEvents() )->getServerDispatchedEvents($component));
    }

    public function test_the_self_modifier_travels_with_the_event(): void
    {
        $component = new class extends Component {};

        $component->emitUp('child_picked')->self();

        self::assertSame('[{"name":"child_picked","params":[],"self":true}]', json_encode($this->dehydrate($component)['ancestorDispatches']));
    }

    public function test_dispatch_keeps_the_livewire_event_and_adds_no_ancestor_dispatches(): void
    {
        $component = new class extends Component {};

        $component->dispatch('child_picked', v: 1);

        self::assertSame([], $this->dehydrate($component));
        self::assertSame('[{"name":"child_picked","params":{"v":1}}]', json_encode(( new SupportEvents() )->getServerDispatchedEvents($component)));
    }

    private function dehydrate(Component $component): array
    {
        $context = new ComponentContext(null, $component, false, new Effects(), new Memo());
        $hook = new SupportEmitUp();
        $hook->setComponent($component);
        $hook->dehydrate($context);

        return $context->getEffects()->getData('bc', default: []);
    }
}
