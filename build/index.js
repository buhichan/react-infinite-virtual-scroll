"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
//AIV stands for async iterator virtualization
function InfiniteVirtualScroll(props) {
    var _a = React.useState(undefined), _ = _a[0], rerender = _a[1];
    var state = React.useMemo(function () {
        return {
            iterator: props.dataSource(),
            data: [],
            heightMap: {},
            start: 0,
            end: 0,
            topSpace: 0,
            bottomSpace: 0,
            done: false
        };
    }, [props.dataSource]);
    React.useLayoutEffect(function () {
        var viewPort = viewPortRef.current;
        var loading = false;
        var loadMore = function () {
            if (loading) {
                return;
            }
            loading = true;
            state.iterator.next().then(function (value) {
                loading = false;
                if (!value.done && !!viewPort) {
                    state.end += value.value.length;
                    state.bottomSpace = 0;
                    state.data = state.data.concat(value.value);
                    rerender({});
                }
            });
        };
        function onScroll(e) {
            if (viewPort) {
                var shouldRerender = false;
                var container = viewPort.parentElement;
                var lastChild = viewPort.lastChild;
                var firstChild = viewPort.firstChild;
                var getHiddenElementHeight = function (index) {
                    var res = state.heightMap[index];
                    if (!res) {
                        console.error("Failed to get height of hidden element");
                    }
                    return res || 0;
                };
                var setHiddenElementHeight = function (index, height) {
                    state.heightMap[index] = height;
                };
                while (container.scrollTop < state.topSpace) {
                    //scroll to top, -start
                    // console.log("head in")
                    if (state.start > 0) {
                        state.start -= 1;
                        state.topSpace -= getHiddenElementHeight(state.start);
                        shouldRerender = true;
                    }
                }
                while (lastChild && container.scrollHeight - container.clientHeight - container.scrollTop > state.bottomSpace + lastChild.clientHeight) {
                    //scroll to top, -end
                    // console.log("tail out")
                    setHiddenElementHeight(state.end - 1, lastChild.clientHeight);
                    state.bottomSpace += lastChild.clientHeight;
                    state.end -= 1;
                    lastChild = lastChild.previousElementSibling;
                    shouldRerender = true;
                }
                while (firstChild && container.scrollTop > state.topSpace + firstChild.clientHeight) {
                    //scroll to bottom, +start
                    // console.log("head out")
                    setHiddenElementHeight(state.start, firstChild.clientHeight);
                    state.topSpace += firstChild.clientHeight;
                    state.start += 1;
                    firstChild = firstChild.nextElementSibling;
                    shouldRerender = true;
                }
                while (container.scrollHeight - container.clientHeight - container.scrollTop < state.bottomSpace) {
                    //scroll to bottom, +end
                    if (state.end < state.data.length) {
                        // console.log("tail in")
                        state.bottomSpace -= getHiddenElementHeight(state.end);
                        state.end += 1;
                        shouldRerender = true;
                    }
                    else {
                        break;
                    }
                }
                if (state.end >= state.data.length) {
                    loadMore();
                }
                shouldRerender && rerender({});
            }
        }
        viewPort && viewPort.parentElement && viewPort.parentElement.addEventListener("scroll", onScroll);
        if (viewPort && viewPort.parentNode && viewPort.clientHeight < viewPort.parentNode.clientHeight) {
            loadMore();
        }
        return function () {
            viewPort && viewPort.parentElement && viewPort.parentElement.removeEventListener('scroll', onScroll);
            viewPort = null;
        };
    }, [props.dataSource]);
    var viewPortRef = React.useRef(null);
    return React.createElement("div", { style: __assign({ overflow: "auto", WebkitOverflowScrolling: "touch" }, props.style) },
        React.createElement("div", { ref: viewPortRef, style: {
                marginTop: state.topSpace,
                marginBottom: state.bottomSpace,
            } }, props.children(state.data.slice(state.start, state.end))));
}
exports.default = InfiniteVirtualScroll;
//# sourceMappingURL=index.js.map