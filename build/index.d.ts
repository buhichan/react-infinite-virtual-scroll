import * as React from "react";
declare type VirtualizeIterator<T> = AsyncIterableIterator<T[] | {
    data: T[];
    total: number;
}>;
declare type VirtualizeProps<T> = {
    dataSource: () => VirtualizeIterator<T>;
};
declare type VirtualizeState<T> = {
    viewPortRef: React.MutableRefObject<HTMLElement>;
    iterator: VirtualizeIterator<T>;
    start: number;
    end: number;
    topSpace: number;
    bottomSpace: number;
    data: T[];
    total: number | null;
    done: boolean;
};
export declare function useInfiniteVirtualScroll<T>(props: VirtualizeProps<T>): VirtualizeState<T>;
export declare type IVSProps<T> = {
    state: VirtualizeState<T>;
    style?: React.CSSProperties;
    children: (t: T[]) => React.ReactNode;
};
export default function InfiniteVirtualScroll<T>(props: IVSProps<T>): JSX.Element;
export {};
