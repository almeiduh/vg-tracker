import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Game } from '../types/game';

interface GameContextType {
    games: Game[];
    isLoading: boolean;
    error: string | null;
    addGame: (game: Omit<Game, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateGame: (id: string, updates: Partial<Game>) => Promise<void>;
    deleteGame: (id: string) => Promise<void>;
    refreshGames: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGames = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('games')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGames(data || []);
        } catch (err: any) {
            console.error('Error fetching games:', err);
            setError(err.message || 'Failed to fetch games');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGames();

        // Set up real-time subscription
        const subscription = supabase
            .channel('public:games')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, payload => {
                console.log('Real-time update:', payload);
                fetchGames(); // Re-fetch on any change for simplicity, could be optimized
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const addGame = async (gameData: Omit<Game, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            setError(null);
            const payload = { ...gameData, user_id: user?.id };
            const { error } = await supabase.from('games').insert([payload]);
            if (error) throw error;
            // Real-time subscription will trigger fetchGames
        } catch (err: any) {
            console.error('Error adding game:', err);
            setError(err.message || 'Failed to add game');
            throw err;
        }
    };

    const updateGame = async (id: string, updates: Partial<Game>) => {
        try {
            setError(null);
            const { error } = await supabase.from('games').update(updates).eq('id', id);
            if (error) throw error;
            // Real-time subscription will trigger fetchGames
        } catch (err: any) {
            console.error('Error updating game:', err);
            setError(err.message || 'Failed to update game');
            throw err;
        }
    };

    const deleteGame = async (id: string) => {
        try {
            setError(null);
            const { error } = await supabase.from('games').delete().eq('id', id);
            if (error) throw error;
            // Real-time subscription will trigger fetchGames
        } catch (err: any) {
            console.error('Error deleting game:', err);
            setError(err.message || 'Failed to delete game');
            throw err;
        }
    };

    return (
        <GameContext.Provider value={{
            games,
            isLoading,
            error,
            addGame,
            updateGame,
            deleteGame,
            refreshGames: fetchGames
        }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGames() {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGames must be used within a GameProvider');
    }
    return context;
}
