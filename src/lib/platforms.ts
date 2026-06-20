import { FaPlaystation, FaXbox, FaLinux, FaApple, FaAndroid, FaSteam } from 'react-icons/fa';
import { SiNintendo, SiNintendoswitch, SiNintendogamecube, SiNintendo3Ds, SiWii, SiWiiu, SiPlaystation2, SiPlaystation3, SiPlaystation4, SiPlaystation5, SiPlaystationportable, SiPlaystationvita, SiSega, SiSaturn } from 'react-icons/si';
import { MdGamepad } from 'react-icons/md';

export interface PlatformConfig {
    icon: React.ElementType;
    color: string;
}

export const getPlatformConfig = (platformName: string): PlatformConfig => {
    const normalized = platformName.toLowerCase();

    // PlayStation - check specific generations first
    if (normalized.includes('playstation 5') || normalized.includes('ps5')) {
        return { icon: SiPlaystation5, color: '#00a2ff' };
    }
    if (normalized.includes('playstation 4') || normalized.includes('ps4')) {
        return { icon: SiPlaystation4, color: '#00a2ff' };
    }
    if (normalized.includes('playstation 3') || normalized.includes('ps3')) {
        return { icon: SiPlaystation3, color: '#00a2ff' };
    }
    if (normalized.includes('playstation 2') || normalized.includes('ps2')) {
        return { icon: SiPlaystation2, color: '#00a2ff' };
    }
    if (normalized.includes('psp') || normalized.includes('playstation portable')) {
        return { icon: SiPlaystationportable, color: '#00a2ff' };
    }
    if (normalized.includes('playstation vita') || normalized.includes('vita')) {
        return { icon: SiPlaystationvita, color: '#00a2ff' };
    }
    if (normalized.includes('playstation')) {
        return { icon: FaPlaystation, color: '#00a2ff' };
    }

    // Xbox Family
    if (normalized.includes('xbox')) {
        return { icon: FaXbox, color: '#2ea043' };
    }

    // Nintendo - check specific platforms first
    if (normalized.includes('nintendo switch') || normalized.includes('switch')) {
        return { icon: SiNintendoswitch, color: '#ff4444' };
    }
    if (normalized.includes('wii u')) {
        return { icon: SiWiiu, color: '#ff4444' };
    }
    if (normalized.includes('wii')) {
        return { icon: SiWii, color: '#ff4444' };
    }
    if (normalized.includes('gamecube') || normalized.includes('game cube')) {
        return { icon: SiNintendogamecube, color: '#ff4444' };
    }
    if (normalized.includes('3ds') || normalized.includes('3 ds')) {
        return { icon: SiNintendo3Ds, color: '#ff4444' };
    }
    if (normalized.includes('nintendo') || normalized.includes('ds') || normalized.includes('game boy') || normalized.includes('n64')) {
        return { icon: SiNintendo, color: '#ff4444' };
    }

    // Sega Family
    if (normalized.includes('dreamcast')) {
        return { icon: SiSega, color: '#6b7280' };
    }
    if (normalized.includes('saturn')) {
        return { icon: SiSaturn, color: '#6b7280' };
    }
    if (normalized.includes('sega') || normalized.includes('genesis') || normalized.includes('megadrive') || normalized.includes('master system') || normalized.includes('game gear')) {
        return { icon: SiSega, color: '#6b7280' };
    }

    // PC / Computer
    if (normalized.includes('pc') || normalized.includes('windows')) {
        return { icon: FaSteam, color: '#cbd5e1' };
    }
    if (normalized.includes('mac') || normalized.includes('apple') || normalized.includes('ios')) {
        return { icon: FaApple, color: '#f1f5f9' };
    }
    if (normalized.includes('linux')) {
        return { icon: FaLinux, color: '#fde047' };
    }
    if (normalized.includes('android')) {
        return { icon: FaAndroid, color: '#4ade80' };
    }

    // Fallback
    return { icon: MdGamepad, color: 'var(--text-secondary)' };
};
