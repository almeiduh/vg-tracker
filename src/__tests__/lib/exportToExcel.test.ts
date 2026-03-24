import { describe, it, expect, vi } from 'vitest';
import type { Game } from '../../types/game';

// Captured args from the mock calls
let capturedRows: Record<string, unknown>[] = [];
let capturedFilename = '';

vi.mock('xlsx', () => {
    const worksheet = { '!cols': [] };
    const workbook = {};

    const utils = {
        json_to_sheet: vi.fn((rows: Record<string, unknown>[]) => {
            capturedRows = rows;
            return worksheet;
        }),
        book_new: vi.fn(() => workbook),
        book_append_sheet: vi.fn(),
    };

    const writeFile = vi.fn((_wb: unknown, filename: string) => {
        capturedFilename = filename;
    });

    return { utils, writeFile };
});

// Import AFTER vi.mock so the hoisted mock is in effect
const { exportGamesToExcel } = await import('../../lib/exportToExcel');

const mockGame: Game = {
    id: '1',
    title: 'Elden Ring',
    status: 'Played',
    format: 'Physical',
    genres: ['RPG', 'Action'],
    platform: 'PlayStation 5',
    rating: 10,
    purchasing_price: 70,
    selling_price: 45,
    start_date: '2022-03-01',
    end_date: '2022-04-15',
    hours_played: 120,
};

const nullFieldGame: Game = {
    id: '2',
    title: 'Unrated Game',
    status: 'Backlog',
    format: 'Digital',
    genres: [],
    platform: 'PC',
    rating: null,
    purchasing_price: null,
    selling_price: null,
    start_date: null,
    end_date: null,
    hours_played: null,
};

describe('exportGamesToExcel', () => {
    it('uses default filename "vg-tracker-export.xlsx"', () => {
        exportGamesToExcel([mockGame]);
        expect(capturedFilename).toBe('vg-tracker-export.xlsx');
    });

    it('accepts a custom filename', () => {
        exportGamesToExcel([mockGame], 'my-games.xlsx');
        expect(capturedFilename).toBe('my-games.xlsx');
    });

    it('produces rows with correct column headers', () => {
        exportGamesToExcel([mockGame]);
        const row = capturedRows[0];
        expect(row).toHaveProperty('Title');
        expect(row).toHaveProperty('Status');
        expect(row).toHaveProperty('Platform');
        expect(row).toHaveProperty('Format');
        expect(row).toHaveProperty('Genres');
        expect(row).toHaveProperty('Rating');
        expect(row).toHaveProperty('Hours Played');
        expect(row).toHaveProperty('Purchasing Price (€)');
        expect(row).toHaveProperty('Selling Price (€)');
        expect(row).toHaveProperty('Start Date');
        expect(row).toHaveProperty('End Date');
    });

    it('maps game fields to correct values', () => {
        exportGamesToExcel([mockGame]);
        const row = capturedRows[0];
        expect(row['Title']).toBe('Elden Ring');
        expect(row['Status']).toBe('Played');
        expect(row['Platform']).toBe('PlayStation 5');
        expect(row['Format']).toBe('Physical');
        expect(row['Rating']).toBe(10);
        expect(row['Hours Played']).toBe(120);
        expect(row['Purchasing Price (€)']).toBe(70);
        expect(row['Selling Price (€)']).toBe(45);
    });

    it('serialises genres array as a comma-separated string', () => {
        exportGamesToExcel([mockGame]);
        expect(capturedRows[0]['Genres']).toBe('RPG, Action');
    });

    it('serialises empty genres array as an empty string', () => {
        exportGamesToExcel([nullFieldGame]);
        expect(capturedRows[0]['Genres']).toBe('');
    });

    it('serialises null numeric fields as empty strings', () => {
        exportGamesToExcel([nullFieldGame]);
        const row = capturedRows[0];
        expect(row['Rating']).toBe('');
        expect(row['Hours Played']).toBe('');
        expect(row['Purchasing Price (€)']).toBe('');
        expect(row['Selling Price (€)']).toBe('');
    });

    it('serialises null date fields as empty strings', () => {
        exportGamesToExcel([nullFieldGame]);
        const row = capturedRows[0];
        expect(row['Start Date']).toBe('');
        expect(row['End Date']).toBe('');
    });

    it('formats valid dates to human-readable form containing the year', () => {
        exportGamesToExcel([mockGame]);
        const row = capturedRows[0];
        expect(String(row['Start Date'])).toContain('2022');
        expect(String(row['End Date'])).toContain('2022');
    });

    it('produces a rows array of the same length as games array', () => {
        exportGamesToExcel([mockGame, nullFieldGame]);
        expect(capturedRows).toHaveLength(2);
    });

    it('handles an empty games array without throwing', () => {
        expect(() => exportGamesToExcel([])).not.toThrow();
        expect(capturedRows).toHaveLength(0);
    });
});
