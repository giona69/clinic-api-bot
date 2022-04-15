const React = require("react")
const ReactDOM = require("react-dom/server")

const Products = (props) => {
  const p = props.product

  return (
    <div>
      <h1>{p.model}</h1>
      <h3>{p.platform}</h3>
    </div>
  )
}

const renderProducts = (product) => {
  return ReactDOM.renderToString(<Products product={product} />)
}

module.exports = {
  Products,
  renderProducts,
}
