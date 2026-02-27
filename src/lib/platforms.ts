import { FaPlaystation, FaXbox, FaLinux, FaApple, FaAndroid, FaSteam } from 'react-icons/fa';
import { SiNintendo, SiNintendoswitch } from 'react-icons/si';
import { MdGamepad } from 'react-icons/md';

export interface PlatformConfig {
    icon: React.ElementType;
    color: string;
}

export const getPlatformConfig = (platformName: string): PlatformConfig => {
    const normalized = platformName.toLowerCase();

    // PlayStation Family
    if (normalized.includes('playstation') || normalized.includes('ps4') || normalized.includes('ps5') || normalized.includes('vita')) {
        return { icon: FaPlaystation, color: '#00a2ff' }; // More vibrant PlayStation Blue
    }

    // Xbox Family
    if (normalized.includes('xbox')) {
        return { icon: FaXbox, color: '#2ea043' }; // More vibrant Xbox Green
    }

    // Nintendo Family
    if (normalized.includes('nintendo switch') || normalized.includes('switch')) {
        return { icon: SiNintendoswitch, color: '#ff4444' }; // More vibrant Switch Red
    }
    if (normalized.includes('nintendo') || normalized.includes('wii') || normalized.includes('ds') || normalized.includes('game boy')) {
        return { icon: SiNintendo, color: '#ff4444' }; // More vibrant Nintendo Red
    }

    // PC / Computer
    if (normalized.includes('pc') || normalized.includes('windows')) {
        return { icon: FaSteam, color: '#cbd5e1' }; // Lighter Slate for PC
    }
    if (normalized.includes('mac') || normalized.includes('apple') || normalized.includes('ios')) {
        return { icon: FaApple, color: '#f1f5f9' }; // Brighter silver for Mac
    }
    if (normalized.includes('linux')) {
        return { icon: FaLinux, color: '#fde047' }; // Brighter Linux Yellow
    }
    if (normalized.includes('android')) {
        return { icon: FaAndroid, color: '#4ade80' }; // Brighter Android Green
    }

    // Fallback
    return { icon: MdGamepad, color: 'var(--text-secondary)' };
};
