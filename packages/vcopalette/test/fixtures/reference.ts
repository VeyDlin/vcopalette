import type { PaletteConfig } from '../../src/types';


export const referenceConfig: PaletteConfig = {
    colors: {
        neutral: {
            group: 'neutral',
            pins: [
                { key: 0, color: '#FFFFFF', name: 'text' },
                { key: 300, color: '#AAAAAA', name: 'text-secondary' },
                { key: 400, color: '#8C8C8C', name: 'caption' },
                { key: 780, color: '#30353E', name: 'grid-line' },
                { key: 800, color: '#2B3038', name: 'track' },
                { key: 830, color: '#262A32', name: 'control' },
                { key: 870, color: '#1D2128', name: 'panel' },
                { key: 900, color: '#191C22', name: 'well' },
                { key: 950, color: '#0F1115', name: 'page-bg' },
            ],
        },
        blue: {
            pins: [
                { key: 400, color: '#58AEEE', name: 'accent' },
                { key: 850, color: '#1E3445', name: 'accent-fill' },
                { key: 930, color: '#0B1A26', name: 'on-accent' },
            ],
        },
        red: {
            pins: [
                { key: 400, color: '#FF595A', name: 'error' },
                { key: 850, color: '#3A1F23', name: 'error-fill' },
            ],
        },
        green: {
            pins: [
                { key: 400, color: '#4FD18B', name: 'healthy' },
                { key: 850, color: '#17291F', name: 'healthy-fill' },
            ],
        },
        amber: {
            pins: [
                { key: 400, color: '#F2A33A', name: 'warning' },
                { key: 850, color: '#33281A', name: 'warning-fill' },
            ],
        },
        violet: {
            pins: [
                { key: 400, color: '#A78BFA', name: 'maintenance' },
                { key: 850, color: '#27223A', name: 'maintenance-fill' },
            ],
        },
        cyan: {
            hue: 215,
        },
        pink: {
            hue: 350,
        },
    },
};
