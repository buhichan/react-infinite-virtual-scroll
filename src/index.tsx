import * as React from 'react';

type VirtualizeProps<T> = {
    dataSource:()=>AsyncIterableIterator<T[]>
    style?:React.CSSProperties,
    children:(t:T[])=>React.ReactNode
}

const MAX_LOOP_COUNT = 10000

//AIV stands for async iterator virtualization
export default function InfiniteVirtualScroll<T>(props:VirtualizeProps<T>){
    
    const [_,rerender] = React.useState(undefined)

    const state = React.useMemo(()=>{
        return {
            iterator:props.dataSource(),
            data:[] as T[],
            heightMap:{} as {[i:number]:number},
            start:0,
            end:0,
            topSpace:0,
            bottomSpace:0,
            done:false
        }
    },[props.dataSource])

    React.useLayoutEffect(()=>{
        let viewPort = viewPortRef.current
        let loading = false
        const loadMore = ()=>{
            if(loading){
                return
            }
            loading = true
            state.iterator.next().then(value=>{
                loading = false
                if(!value.done && !!viewPort){
                    state.end += value.value.length
                    state.bottomSpace = 0
                    state.data = state.data.concat(value.value)
                    rerender({})
                }
            })
        }
        function onScroll(e:Event){
            if(viewPort){
                let shouldRerender = false
                const container = viewPort.parentElement as HTMLDivElement
                let lastChild = viewPort.lastChild as HTMLElement | null
                let firstChild = viewPort.firstChild as HTMLElement | null
                const getHiddenElementHeight = (index:number)=>{
                    const res = state.heightMap[index]
                    if(!res){
                        console.error("Failed to get height of hidden element")
                    }
                    return res || 0
                }
                const setHiddenElementHeight = (index:number,height:number)=>{
                    state.heightMap[index] = height
                }
                let loopCount = 0
                // scrollTop must be clamped since in some browser it may drop below zero
                // TODO: reading scrollTop cause reflow, how to avoid it ?
                const scrollTop = Math.max(0, container.scrollTop)

                while(scrollTop < state.topSpace && loopCount++ < MAX_LOOP_COUNT){
                    //scroll to top, -start
                    // console.log("head in")
                    if(state.start > 0){
                        state.start -= 1
                        state.topSpace -= getHiddenElementHeight(state.start)
                        shouldRerender = true
                    }
                }
                while(lastChild && container.scrollHeight - container.clientHeight - scrollTop > state.bottomSpace + lastChild.clientHeight && loopCount++ < MAX_LOOP_COUNT){
                    //scroll to top, -end
                    // console.log("tail out")
                    setHiddenElementHeight(state.end-1, lastChild.clientHeight)
                    state.bottomSpace += lastChild.clientHeight
                    state.end -= 1
                    lastChild = lastChild.previousElementSibling as HTMLElement | null
                    shouldRerender = true
                }
                while(firstChild &&scrollTop > state.topSpace + firstChild.clientHeight  && loopCount++ < MAX_LOOP_COUNT){
                    //scroll to bottom, +start
                    // console.log("head out")
                    setHiddenElementHeight(state.start, firstChild.clientHeight)
                    state.topSpace += firstChild.clientHeight
                    state.start += 1
                    firstChild = firstChild.nextElementSibling as HTMLElement | null
                    shouldRerender = true
                }
                while(container.scrollHeight - container.clientHeight - scrollTop  < state.bottomSpace  && loopCount++ < MAX_LOOP_COUNT){
                    //scroll to bottom, +end
                    if(state.end < state.data.length){
                        // console.log("tail in")
                        state.bottomSpace -= getHiddenElementHeight(state.end)
                        state.end += 1
                        shouldRerender = true
                    }else{
                        break;
                    }
                }
                if(state.end >= state.data.length){
                    loadMore()
                }
                if(loopCount > MAX_LOOP_COUNT){
                    throw new Error("Loop count exceeded, it's a bug, please file an issue")
                }
                shouldRerender && rerender({})
            }
        }
        viewPort && viewPort.parentElement && viewPort.parentElement.addEventListener("scroll",onScroll,{
            passive: true
        })
        if(viewPort && viewPort.parentNode && viewPort.clientHeight < (viewPort.parentNode as HTMLElement).clientHeight){
            loadMore()
        }
        return ()=>{
            viewPort && viewPort.parentElement && viewPort.parentElement.removeEventListener('scroll',onScroll)
            viewPort = null
        }
    },[props.dataSource])

    const viewPortRef = React.useRef(null as HTMLDivElement | null)

    return <div style={{
        overflow:"auto",
        WebkitOverflowScrolling:"touch",
        ...props.style,
    }}>
        <div ref={viewPortRef} style={{
            marginTop:state.topSpace,
            marginBottom:state.bottomSpace,
        }}>
            {
                props.children(state.data.slice(state.start,state.end))
            }
        </div>
    </div>
}