import * as React from 'react';
declare type VirtualizeProps<T> = {
    dataSource: () => AsyncIterableIterator<T[]>;
    style?: React.CSSProperties;
    children: (t: T[]) => React.ReactNode;
};
export default function InfiniteVirtualScroll<T>(props: VirtualizeProps<T>): JSX.Element;
export {};
