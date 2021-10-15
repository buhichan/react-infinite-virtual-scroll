import * as React from "react"

type VirtualizeIterator<T> = AsyncIterableIterator<
    T[] | { data: T[]; total: number }
>

type VirtualizeProps<T> = {
    dataSource: () => VirtualizeIterator<T>
}

type VirtualizeState<T> = {
    viewPortRef: React.MutableRefObject<HTMLElement>
    iterator: VirtualizeIterator<T>
    start: number
    end: number
    topSpace: number
    bottomSpace: number
    data: T[]
    error: Error | null
    total: number | null
    done: boolean,
    loading: boolean,

    isInitial: boolean,
    heightMap:{[i:number]:number}
}

const MAX_LOOP_COUNT = 10000

export function useInfiniteVirtualScroll<T>(
    props: VirtualizeProps<T>
): VirtualizeState<T> {

    const viewPortRef = React.useRef(null as HTMLDivElement | null)

    const nextState = React.useMemo(() => {
        return {
            iterator: props.dataSource(),
            data: [] as T[],
            total: null,
            start: 0,
            end: 0,
            topSpace: 0,
            bottomSpace: 0,
            done: false,
            loading: false,
            heightMap: {} as { [i: number]: number },
            isInitial: true,
        } as Omit<VirtualizeState<T>, 'viewPortRef'>
    }, [props.dataSource])

    const [state, updateState] = React.useState(nextState)

    React.useLayoutEffect(() => {
        let viewPort = viewPortRef.current
        // let loading = false
        const loadMore = () => {
            if (nextState.loading) {
                return
            }
            if (!viewPort) {
                return
            }
            updateState({
                ...nextState,
                loading: true
            })
            nextState.loading = true
            nextState.error = null
            nextState.iterator.next().then(iteratorResult => {
                nextState.loading = false
                if (!iteratorResult.done) {
                    const value = iteratorResult.value as
                        | T[]
                        | { data: T[]; total: number }
                    if (Array.isArray(value)) {
                        nextState.end += value.length
                        nextState.bottomSpace = 0
                        nextState.data = nextState.data.concat(value)
                        nextState.total = null
                    } else {
                        nextState.end += value.data.length
                        nextState.bottomSpace = 0
                        nextState.data = nextState.data.concat(value.data)
                        nextState.total = value.total
                    }
                }
                if (viewPort) {
                    updateState({ ...nextState })
                }
            }).catch(err=>{
                nextState.loading = false
                if (viewPort) {
                    updateState({ ...nextState, error: err })
                }
            })
        }
        if (viewPort && viewPort.parentElement && viewPort.parentNode) {
            const onScroll = (e: Event) => {
                if (viewPort) {
                    let shouldRerender = false
                    const container = viewPort.parentElement as HTMLDivElement
                    let lastChild = viewPort.lastChild as HTMLElement | null
                    let firstChild = viewPort.firstChild as HTMLElement | null
                    const getHiddenElementHeight = (index: number) => {
                        const res = nextState.heightMap[index]
                        if (!res) {
                            console.error(
                                "Failed to get height of hidden element"
                            )
                        }
                        return res || 0
                    }
                    const setHiddenElementHeight = (
                        index: number,
                        height: number
                    ) => {
                        nextState.heightMap[index] = height
                    }
                    let loopCount = 0
                    // scrollTop must be clamped since in some browser it may drop below zero
                    // TODO: reading scrollTop cause reflow, how to avoid it ?
                    const scrollTop = Math.max(0, container.scrollTop)

                    while (
                        scrollTop < nextState.topSpace &&
                        loopCount++ < MAX_LOOP_COUNT
                    ) {
                        //scroll to top, -start
                        // console.log("head in")
                        if (nextState.start > 0) {
                            nextState.start -= 1
                            nextState.topSpace -= getHiddenElementHeight(
                                nextState.start
                            )
                            shouldRerender = true
                        }
                    }
                    while (
                        lastChild &&
                        container.scrollHeight -
                            container.clientHeight -
                            scrollTop >
                            nextState.bottomSpace + lastChild.clientHeight &&
                        loopCount++ < MAX_LOOP_COUNT
                    ) {
                        //scroll to top, -end
                        // console.log("tail out")
                        setHiddenElementHeight(
                            nextState.end - 1,
                            lastChild.clientHeight
                        )
                        nextState.bottomSpace += lastChild.clientHeight
                        nextState.end -= 1
                        lastChild = lastChild.previousElementSibling as HTMLElement | null
                        shouldRerender = true
                    }
                    while (
                        firstChild &&
                        scrollTop >
                            nextState.topSpace + firstChild.clientHeight &&
                        loopCount++ < MAX_LOOP_COUNT
                    ) {
                        //scroll to bottom, +start
                        // console.log("head out")
                        setHiddenElementHeight(
                            nextState.start,
                            firstChild.clientHeight
                        )
                        nextState.topSpace += firstChild.clientHeight
                        nextState.start += 1
                        firstChild = firstChild.nextElementSibling as HTMLElement | null
                        shouldRerender = true
                    }
                    while (
                        container.scrollHeight -
                            container.clientHeight -
                            scrollTop <
                            nextState.bottomSpace &&
                        loopCount++ < MAX_LOOP_COUNT
                    ) {
                        //scroll to bottom, +end
                        if (nextState.end < nextState.data.length) {
                            // console.log("tail in")
                            nextState.bottomSpace -= getHiddenElementHeight(
                                nextState.end
                            )
                            nextState.end += 1
                            shouldRerender = true
                        } else {
                            break
                        }
                    }
                    if (nextState.end >= nextState.data.length) {
                        loadMore()
                    }
                    if (loopCount > MAX_LOOP_COUNT) {
                        throw new Error(
                            `Max loop count (${MAX_LOOP_COUNT}) exceeded, it's a bug, please file an issue`
                        )
                    }
                    shouldRerender && updateState({...nextState})
                }
            }
            viewPort &&
                viewPort.parentElement &&
                viewPort.parentElement.addEventListener("scroll", onScroll, {
                    passive: true,
                })
            if (nextState.isInitial) {
                nextState.isInitial = false
                loadMore()
            }else if (
                viewPort &&
                viewPort.parentNode &&
                viewPort.clientHeight <
                    (viewPort.parentNode as HTMLElement).clientHeight
            ) {
                loadMore()
            }
            return () => {
                viewPort &&
                    viewPort.parentElement &&
                    viewPort.parentElement.removeEventListener(
                        "scroll",
                        onScroll
                    )
                viewPort = null
            }
        }
    }, [props.dataSource])

    return {
        viewPortRef,
        ...state,
    }
}

export type IVSProps<T> = {
    state: VirtualizeState<T>
    style?: React.CSSProperties
    children: (t: T[]) => React.ReactNode
}

//AIV stands for async iterator virtualization
export default function InfiniteVirtualScroll<T>(props: IVSProps<T>) {
    const state = props.state

    return (
        <div
            style={{
                overflow: "auto",
                WebkitOverflowScrolling: "touch",
                ...props.style,
            }}
        >
            <div
                ref={state.viewPortRef as any}
                style={{
                    marginTop: state.topSpace,
                    marginBottom: state.bottomSpace,
                }}
            >
                {props.children(state.data.slice(state.start, state.end))}
            </div>
        </div>
    )
}
