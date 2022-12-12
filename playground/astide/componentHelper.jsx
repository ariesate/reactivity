/** @jsx createElement */
/** @jsxFrag Fragment */
import { createElement, Fragment } from './DOM'

const BracketBoundary = ['{', '}']

export function withSeparator(arr, item) {
  if (arr.length < 2) return arr
  return arr.reduce(( last, current, index) => {
    last.push(current)
    if (index !== arr.length - 1) last.push(<separator>{item}</separator>)
    return last
  }, [])
}

export function makeKeyword(name, leftSpace) {
  return <>{leftSpace ? <space>{` `}</space> : null}<keyword>{name}</keyword><space>{' '}</space></>
}

export function makeBlock({ Tag, keyword, variable, boundaries, children, next, semicolon, block, isChild, nextChildBlock }) {
  const RealTag = Tag || (block ?  (isChild ? 'childBlock' : 'block') : 'inline')
  return (
    <RealTag>
      {keyword ? Array.isArray(keyword) ? (keyword.map(k =>makeKeyword(k))) : makeKeyword(keyword) : null}
      {keyword ? <space>{` `}</space> : null}
      {variable ? <variable role={variable.role}>{variable.value}</variable> : null}
      {children ? (boundaries ? withBoundary(boundaries, children) : children) : null}
      {next ? next : null}
      {nextChildBlock ? <>
        <boundary start>{BracketBoundary[0]}</boundary>
        <childBlock>
          {nextChildBlock}
        </childBlock>
        <boundary end>{BracketBoundary[1]}</boundary>
      </> : null}
      {semicolon ? <semicolon>;</semicolon> : null}
    </RealTag>
  )
}

export function withBoundary(boundaries, child) {
  return (
    <>
      <boundary start>{boundaries[0]}</boundary>
      {child}
      <boundary end>{boundaries[1]}</boundary>
    </>
  )
}

