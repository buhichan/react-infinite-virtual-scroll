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
exports.useInfiniteVirtualScroll = void 0;
var React = require("react");
var MAX_LOOP_COUNT = 10000;
function useInfiniteVirtualScroll(props) {
    var viewPortRef = React.useRef(null);
    var nextState = React.useMemo(function () {
        return {
            iterator: props.dataSource(),
            data: [],
            total: null,
            start: 0,
            end: 0,
            topSpace: 0,
            bottomSpace: 0,
            done: false,
            loading: false,
            heightMap: {},
            isInitial: true,
        };
    }, [props.dataSource]);
    var _a = React.useState(nextState), state = _a[0], updateState = _a[1];
    React.useLayoutEffect(function () {
        var viewPort = viewPortRef.current;
        // let loading = false
        var loadMore = function () {
            if (nextState.loading) {
                return;
            }
            updateState(__assign(__assign({}, nextState), { loading: true }));
            nextState.loading = true;
            nextState.error = null;
            nextState.iterator.next().then(function (iteratorResult) {
                nextState.loading = false;
                if (!iteratorResult.done) {
                    var value = iteratorResult.value;
                    if (Array.isArray(value)) {
                        nextState.end += value.length;
                        nextState.bottomSpace = 0;
                        nextState.data = nextState.data.concat(value);
                        nextState.total = null;
                    }
                    else {
                        nextState.end += value.data.length;
                        nextState.bottomSpace = 0;
                        nextState.data = nextState.data.concat(value.data);
                        nextState.total = value.total;
                    }
                }
                updateState(__assign({}, nextState));
            }).catch(function (err) {
                nextState.loading = false;
                updateState(__assign(__assign({}, nextState), { error: err }));
            });
        };
        if (viewPort && viewPort.parentElement && viewPort.parentNode) {
            var onScroll_1 = function (e) {
                if (viewPort) {
                    var shouldRerender = false;
                    var container = viewPort.parentElement;
                    var lastChild = viewPort.lastChild;
                    var firstChild = viewPort.firstChild;
                    var getHiddenElementHeight = function (index) {
                        var res = nextState.heightMap[index];
                        if (!res) {
                            console.error("Failed to get height of hidden element");
                        }
                        return res || 0;
                    };
                    var setHiddenElementHeight = function (index, height) {
                        nextState.heightMap[index] = height;
                    };
                    var loopCount = 0;
                    // scrollTop must be clamped since in some browser it may drop below zero
                    // TODO: reading scrollTop cause reflow, how to avoid it ?
                    var scrollTop = Math.max(0, container.scrollTop);
                    while (scrollTop < nextState.topSpace &&
                        loopCount++ < MAX_LOOP_COUNT) {
                        //scroll to top, -start
                        // console.log("head in")
                        if (nextState.start > 0) {
                            nextState.start -= 1;
                            nextState.topSpace -= getHiddenElementHeight(nextState.start);
                            shouldRerender = true;
                        }
                    }
                    while (lastChild &&
                        container.scrollHeight -
                            container.clientHeight -
                            scrollTop >
                            nextState.bottomSpace + lastChild.clientHeight &&
                        loopCount++ < MAX_LOOP_COUNT) {
                        //scroll to top, -end
                        // console.log("tail out")
                        setHiddenElementHeight(nextState.end - 1, lastChild.clientHeight);
                        nextState.bottomSpace += lastChild.clientHeight;
                        nextState.end -= 1;
                        lastChild = lastChild.previousElementSibling;
                        shouldRerender = true;
                    }
                    while (firstChild &&
                        scrollTop >
                            nextState.topSpace + firstChild.clientHeight &&
                        loopCount++ < MAX_LOOP_COUNT) {
                        //scroll to bottom, +start
                        // console.log("head out")
                        setHiddenElementHeight(nextState.start, firstChild.clientHeight);
                        nextState.topSpace += firstChild.clientHeight;
                        nextState.start += 1;
                        firstChild = firstChild.nextElementSibling;
                        shouldRerender = true;
                    }
                    while (container.scrollHeight -
                        container.clientHeight -
                        scrollTop <
                        nextState.bottomSpace &&
                        loopCount++ < MAX_LOOP_COUNT) {
                        //scroll to bottom, +end
                        if (nextState.end < nextState.data.length) {
                            // console.log("tail in")
                            nextState.bottomSpace -= getHiddenElementHeight(nextState.end);
                            nextState.end += 1;
                            shouldRerender = true;
                        }
                        else {
                            break;
                        }
                    }
                    if (nextState.end >= nextState.data.length) {
                        loadMore();
                    }
                    if (loopCount > MAX_LOOP_COUNT) {
                        throw new Error("Max loop count (" + MAX_LOOP_COUNT + ") exceeded, it's a bug, please file an issue");
                    }
                    shouldRerender && updateState(__assign({}, nextState));
                }
            };
            viewPort &&
                viewPort.parentElement &&
                viewPort.parentElement.addEventListener("scroll", onScroll_1, {
                    passive: true,
                });
            if (nextState.isInitial) {
                nextState.isInitial = false;
                loadMore();
            }
            else if (viewPort &&
                viewPort.parentNode &&
                viewPort.clientHeight <
                    viewPort.parentNode.clientHeight) {
                loadMore();
            }
            return function () {
                viewPort &&
                    viewPort.parentElement &&
                    viewPort.parentElement.removeEventListener("scroll", onScroll_1);
                viewPort = null;
            };
        }
    }, [props.dataSource]);
    return __assign({ viewPortRef: viewPortRef }, state);
}
exports.useInfiniteVirtualScroll = useInfiniteVirtualScroll;
//AIV stands for async iterator virtualization
function InfiniteVirtualScroll(props) {
    var state = props.state;
    return (React.createElement("div", { style: __assign({ overflow: "auto", WebkitOverflowScrolling: "touch" }, props.style) },
        React.createElement("div", { ref: state.viewPortRef, style: {
                marginTop: state.topSpace,
                marginBottom: state.bottomSpace,
            } }, props.children(state.data.slice(state.start, state.end)))));
}
exports.default = InfiniteVirtualScroll;
//# sourceMappingURL=index.js.map