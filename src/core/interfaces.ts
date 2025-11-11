export interface TariffData {
    boxSize: number;
    coefficient: number;
    warehouseName: string;
    geoName?: string;
    isMarketplace: boolean;
}

export interface DataSink<T> {
    send(data: T[]): Promise<void>;
}
