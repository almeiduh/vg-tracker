import * as XLSX from 'xlsx';
import type { Game } from '../types/game';
import { formatDate } from './formatDate';

function formatNumber(value: number | null): number | string {
    return value !== null ? value : '';
}

export function exportGamesToExcel(games: Game[], filename = 'vg-tracker-export.xlsx'): void {
    const rows = games.map((game) => ({
        'Title': game.title,
        'Status': game.status,
        'Platform': game.platform,
        'Format': game.format,
        'Genres': game.genres.join(', '),
        'Rating': formatNumber(game.rating),
        'Hours Played': formatNumber(game.hours_played),
        'Purchasing Price (€)': formatNumber(game.purchasing_price),
        'Selling Price (€)': formatNumber(game.selling_price),
        'Start Date': formatDate(game.start_date),
        'End Date': formatDate(game.end_date),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths for readability
    worksheet['!cols'] = [
        { wch: 36 }, // Title
        { wch: 12 }, // Status
        { wch: 22 }, // Platform
        { wch: 12 }, // Format
        { wch: 28 }, // Genres
        { wch: 8 },  // Rating
        { wch: 14 }, // Hours Played
        { wch: 22 }, // Purchasing Price
        { wch: 18 }, // Selling Price
        { wch: 14 }, // Start Date
        { wch: 14 }, // End Date
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Games');

    XLSX.writeFile(workbook, filename);
}
