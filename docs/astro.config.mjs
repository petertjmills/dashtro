// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import starlightThemeBlack from 'starlight-theme-black';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		react(),
		starlight({
			title: 'Dashtro',
			favicon: '/favicon.svg',
			components: {
				Head: './src/components/Head.astro',
				Hero: './src/components/Hero.astro',
			},
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'shortcut icon',
						type: 'image/svg+xml',
						href: '/favicon-dark.svg',
						media: '(prefers-color-scheme: dark)',
					},
				},
			],
			logo: {
				light: '../assets/logo-black-gradient-dashtro.svg',
				dark: '../assets/logo-white-gradient-dashtro.svg',
				alt: 'Dashtro',
				replacesTitle: true,
			},
			customCss: ['./src/styles/charts.css', './src/styles/site.css'],
			plugins: [
				starlightThemeBlack({
					navLinks: [
						{ label: 'Tutorials', link: '/tutorials/first-dashboard/' },
						{ label: 'Examples', link: '/examples/' },
						{ label: 'Reference', link: '/reference/configuration/' },
					],
				}),
			],
			sidebar: [
				{ label: 'Examples', link: '/examples/' },
				{
					label: 'Tutorials',
					items: [{ autogenerate: { directory: 'tutorials' } }],
				},
				{
					label: 'How-to guides',
					items: [{ autogenerate: { directory: 'how-to' } }],
				},
				{
					label: 'Reference',
					items: [{ autogenerate: { directory: 'reference' } }],
				},
				{
					label: 'Explanation',
					items: [{ autogenerate: { directory: 'explanation' } }],
				},
			],
		}),
	],
});
