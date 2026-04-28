<script lang="ts">
	import Palette from '$lib/icons/Palette.svelte';
	import ProjectDetails from '$lib/icons/ProjectDetails.svelte';
	import LookAndFeelPanel from './LookAndFeelPanel.svelte';
	import ProjectDetailsPanel from './ProjectDetailsPanel.svelte';

	let { isOpen = $bindable(false), onClose }: { isOpen?: boolean; onClose: () => void } = $props();

	let activeTab = $state('look-and-feel');

	const tabs = [
		{ id: 'look-and-feel', label: 'Look and Feel', icon: Palette, component: LookAndFeelPanel },
		{ id: 'project-details', label: 'Project Details', icon: ProjectDetails, component: ProjectDetailsPanel }
	];

	function handleOverlayClick() {
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
		onclick={handleOverlayClick}
		onkeydown={() => {}}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-2xl mx-4 rounded-lg border border-(--color-muted)/30 bg-(--color-surface) shadow-2xl overflow-hidden flex min-h-80"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<nav class="w-48 border-r border-(--color-muted)/20 p-4">
				<ul class="space-y-1">
					{#each tabs as tab}
						<li>
							<button
								type="button"
								class="w-full text-left px-3 py-2 rounded text-sm transition-colors cursor-pointer flex items-center gap-2
								{tab.id === activeTab
									? 'bg-(--color-heading)/20 text-(--color-heading) font-medium'
									: 'text-(--color-muted) hover:bg-(--color-surface) hover:text-(--color-text)'}"
								onclick={() => (activeTab = tab.id)}
							>
								<tab.icon class="w-4 h-4 shrink-0" />
								{tab.label}
							</button>
						</li>
					{/each}
				</ul>
			</nav>

			<div class="flex-1 p-6">
				{#if activeTab === 'look-and-feel'}
					<LookAndFeelPanel />
				{:else if activeTab === 'project-details'}
					<ProjectDetailsPanel />
				{/if}
			</div>
		</div>
	</div>
{/if}
