import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render graph svg', () => {
		const { container } = render(Page, {
			data: { user: null, userProfile: null }
		});

		expect(container.querySelector('svg')).not.toBeNull();
	});
});
