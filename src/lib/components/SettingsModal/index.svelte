<script lang="ts">
	import Palette from "$lib/icons/Palette.svelte";
	import ProjectDetails from "$lib/icons/ProjectDetails.svelte";
	import Lock from "$lib/icons/Lock.svelte";
	import AuthenticationPanel from "./AuthenticationPanel.svelte";
	import LookAndFeelPanel from "./LookAndFeelPanel.svelte";
	import ProjectDetailsPanel from "./ProjectDetailsPanel.svelte";

	let {
		isOpen = $bindable(false),
		onClose,
	}: { isOpen?: boolean; onClose: () => void } = $props();

	let activeTab = $state("look-and-feel");

	const tabs = [
		{
			id: "look-and-feel",
			label: "Look and Feel",
			icon: Palette,
			component: LookAndFeelPanel,
		},
		{
			id: "authentication",
			label: "Authentication",
			icon: Lock,
			component: AuthenticationPanel,
		},
		{
			id: "project-details",
			label: "Project Details",
			icon: ProjectDetails,
			component: ProjectDetailsPanel,
		},
	];

	function handleOverlayClick() {
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4"
		onclick={handleOverlayClick}
		onkeydown={() => {}}
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex h-full max-h-[24rem] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-(--color-muted)/30 bg-(--color-surface) shadow-2xl sm:flex-row"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
		>
			<nav
				class="w-full border-b border-(--color-muted)/20 p-3 sm:w-56 sm:border-r sm:border-b-0 sm:p-4"
			>
				<ul class="flex gap-2 overflow-x-auto sm:block sm:space-y-1">
					{#each tabs as tab (tab.id)}
						<li>
							<button
								type="button"
								class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm whitespace-nowrap transition-colors cursor-pointer sm:whitespace-normal
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

			<div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
				{#if activeTab === "look-and-feel"}
					<LookAndFeelPanel />
				{:else if activeTab === "authentication"}
					<AuthenticationPanel onAuthenticated={onClose} />
				{:else if activeTab === "project-details"}
					<ProjectDetailsPanel />
				{/if}
			</div>
		</div>
	</div>
{/if}
