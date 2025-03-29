export interface Game {
    id: string;
    date: Date;
    goals_against: number;
    goals_for: number;
    opponent: string;
}

export interface Player {
    name: string;
}
