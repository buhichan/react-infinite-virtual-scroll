# React Infinite Virtual Scroll

demo: [github page](https://buhichan.github.io/#/virtual-scroll-demo)

# Why

There are already many virtualize list libraries out there, but I can't find one that satisfies all these, so I decided to create one myself.

- Simple: no dependencies other than react
- Allow dynamic row height
    - But the viewport height must be fixed.
    - Set the viewport height by passing `style` prop.
- Utilizing async iterable feature which is awesome.
- High Performance

# How
*Important: You Must set a fixed height via style prop for it to work!*

```tsx
import InfiniteVirtualScroll from "react-infinite-virtual-scroll"

function Foo(){
    const [searchText,setSearchText] = useState("")
    const dataSource = useMemo(()=>async function *GetData(){
        let total = Infinity
        let page = 0
        let pageSize = 20
        while(page * pageSize < total){
            const {data,total:remoteTotal} = await fetch("/data",{
                method:"post",
                body:JSON.stringify({
                    page,
                    pageSize:pageSize
                })
            })
            page = page + 1
            total = remoteTotal
            yield data
        }
    },[searchText])

    return <div>
        <InfiniteVirtualScroll dataSource={dataSource} style={{height:"200vh" /** Height Must Not Be "auto" For It To Work */  }}>  
            {(rows)=>{
                return rows.map(row=><div key={row.id}>
                    <ItemDisplayComponent item={item} />
                </div>)
            }}
        </InfiniteVirtualScroll>
    </div>
}
```

# License
[Anti996](https://github.com/996icu/996.ICU/blob/master/LICENSE)