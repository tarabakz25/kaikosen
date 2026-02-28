const STORAGE_KEY = 'kaiko-theme';

export type Theme = 'light' | 'dark';

export function getTheme(): Theme {
	if (typeof document === 'undefined') return 'light';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'dark' || stored === 'light') return stored;
	return 'light';
}

export function setTheme(theme: Theme) {
	localStorage.setItem(STORAGE_KEY, theme);
	document.documentElement.setAttribute('data-theme', theme);
}
