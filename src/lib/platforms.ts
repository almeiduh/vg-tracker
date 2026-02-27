import { FaPlaystation, FaXbox, FaWindows, FaLinux, FaApple, FaAndroid, FaSteam } from 'react-icons/fa';
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
        return { icon: FaPlaystation, color: '#003791' }; // PlayStation Blue
    }

    // Xbox Family
    if (normalized.includes('xbox')) {
        return { icon: FaXbox, color: '#107C10' }; // Xbox Green
    }

    // Nintendo Family
    if (normalized.includes('nintendo switch') || normalized.includes('switch')) {
        return { icon: SiNintendoswitch, color: '#E60012' }; // Switch Red
    }
    if (normalized.includes('nintendo') || normalized.includes('wii') || normalized.includes('ds') || normalized.includes('game boy')) {
        return { icon: SiNintendo, color: '#E60012' }; // Nintendo Red
    }

    // PC / Computer
    if (normalized.includes('pc') || normalized.includes('windows')) {
        return { icon: FaSteam, color: '#0078D7' }; // Windows Blue
    }
    if (normalized.includes('mac') || normalized.includes('apple') || normalized.includes('ios')) {
        return { icon: FaApple, color: '#A2AAAD' }; // Apple Silver/Gray
    }
    if (normalized.includes('linux')) {
        return { icon: FaLinux, color: '#FCC624' }; // Linux Yellow
    }
    if (normalized.includes('android')) {
        return { icon: FaAndroid, color: '#3DDC84' }; // Android Green
    }

    // Fallback
    return { icon: MdGamepad, color: 'var(--text-secondary)' };
};
