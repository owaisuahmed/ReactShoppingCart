// To view React Cart:
// http://localhost:8080/index.html
// To check if Strapi is getting values through the API:
// http://localhost:1337/api/products

// simulate getting products from DataBase
const products = [
  { name: "Apples", country: "Italy", cost: 3, instock: 10 },
  { name: "Oranges", country: "Spain", cost: 4, instock: 3 },
  { name: "Beans", country: "USA", cost: 2, instock: 5 },
  { name: "Cabbage", country: "USA", cost: 1, instock: 8 },
];

//=========Cart=============
const Cart = (props) => {
  const { Card, Accordion, Button } = ReactBootstrap;
  let data = props.location.data ? props.location.data : products;
  console.log(`data:${JSON.stringify(data)}`);

  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

// We call this in Products.
const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  // Do the fetch. Will be called because we have changed the URL. URLs tracked below.
  // Data will be returned in state.
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URl");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  // It is tracking the URLs here.
  }, [url]);
  return [state, setUrl];
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

// Products web component. The doFetch for useDataApi is here.
const Products = (props) => {
  const [items, setItems] = React.useState(products);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const {
    Card,
    Accordion,
    Button,
    Container,
    Row,
    Col,
    Image,
    Input,
  } = ReactBootstrap;
  //  Fetch Data
  const { Fragment, useState, useEffect, useReducer } = React;
  // Updated URL to: "http://localhost:1337/api/products" . "http://localhost:1337/products" does not work.
  const [query, setQuery] = useState("http://localhost:1337/api/products");
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    "http://localhost:1337/api/products",
    {
      data: [],
    }
  );
  console.log(`Rendering Products ${JSON.stringify(data)}`);
  // Fetch Data
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    if (item[0].instock == 0) return;
    item[0].instock = item[0].instock - 1;
    console.log(`add to Cart ${JSON.stringify(item)}`);
    setCart([...cart, ...item]);
    // Uncommented below
    doFetch(query);
  };
  
  const deleteCartItem = (index) => {
    let newCart = cart.filter((item, i) => index != i);
    // Increment the in stock amount for the item that is removed from the cart.
    let removedItem = cart.filter((item, i) => i == index);
    let currentItems = items.map((item, index) => {
      if (item.name == removedItem[0].name)  item.instock += 1;
      return item; 
    })
    //
    setCart(newCart);
    setItems(currentItems);    
  };
      
  // Render the list of items
  let list = items.map((item, index) => {
    let n = index + 1049;
    // URL for random images to be used as product photos, 50px x 50px in size.
    let url = "https://picsum.photos/id/" + n + "/50/50";

    return (
      <li key={index}>
        <Image src={url} width={70} roundedCircle></Image>
        <Button variant="primary" size="large">
          {item.name}: ${item.cost} | In stock: {item.instock} In Stock
        </Button>
        <input name={item.name} type="submit" onClick={addToCart}></input>
      </li>
    );
  });
  let cartList = cart.map((item, index) => {
    return (
      <Accordion.Item key={1+index} eventKey={1 + index}>
        <Accordion.Header>
          {item.name}
        </Accordion.Header>
        <Accordion.Body onClick={() => deleteCartItem(index)}
          eventKey={1 + index}>
          $ {item.cost} from {item.country}
        </Accordion.Body>
      </Accordion.Item>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };
  
  // Implement the restockProducts function.
  const restockProducts = (url) => {
    doFetch(url);
    // Pick out items. "data" comes from Strapi database and has extra fields. Only interested in the fields listed,
    // so destructure and put it an object and return it. newItems is an array of objects.
    let newItems = data.map((item) => {
      let {name, country, cost, instock} = item;
      return {name, country, cost, instock};
    });
    // Add newItems to setItems, so spread the present '([...items,' and add in the '...newItems]);'.
    setItems([...items, ...newItems]);
  };

  // Refer to video 19-6, ~2:15: If we restock, then "list" should have the new products. "cartList" will remain the same.
  // "CheckOut" is fine. "form" is to get the restock of the products.
  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <ul style={{ listStyleType: "none" }}>{list}</ul>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col>
          <h1>CheckOut </h1>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          onSubmit={(event) => {
            // Going to the Strapi database. "query" should be "products".
            // No need to update URL ("http://localhost:1337/api/"), below one works fine here.
            restockProducts(`http://localhost:1337/${query}`);
            console.log(`Restock called on ${query}`);
            // To prevent this from being called all the time. Only want it called when we click on submit above.
            event.preventDefault();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Restock Products</button>
        </form>
      </Row>
    </Container>
  );
};
// ========================================
ReactDOM.render(<Products />, document.getElementById("root"));
