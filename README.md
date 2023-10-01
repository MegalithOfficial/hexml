# HexML 📜

HexML is a lightweight data serialization format designed for human readability and ease of use. It provides a simple and intuitive way to represent structured data with support for various data types.

## Features 🚀

- **Human-Readable**: HexML is designed to be easy to read and write, making it a great choice for configuration files and data exchange between humans. 📖
- **Support for Data Types**: HexML supports a variety of data types, including strings, numbers (integers and floats), booleans, arrays, and objects. 💪
- **Nesting**: You can nest objects and arrays within HexML, allowing you to represent complex data structures. 🎁

## Getting Started 🛠️

To use HexML in your project, you can follow these steps:

1. **Installation**:
   - Install the HexML package using `npm i hexml`.

2. **Usage**:
   - Deserialize HexML content using the `deserialize` function from the `hexml` package.
   - Serialize your data into HexML format using the `serialize` function for storage or exchange.

You can import HexML in CommonJS, TypeScript, and ES modules 📥:
```javascript 
// CommonJS
const hexml = require('hexml');

// or in ESM/Typescript
import hexml from 'hexml';
```

### Example 📝

Here's a simple example of HexML data:

```hexml
name: "John Doe";
age: 30;
isStudent: true;
gradeArray: <[95, 88, 76]>;
address: <{
  street: "123 Main St",
  city: "Cityville"
}>;
sum: {10 + 5};
product: {2 * 3};
result: ={sum + age}; # Using previously defined values
date: <Date("Sun Oct 01 2023 18:24:38 GMT+0300")>;
dateNow: <Date("now")>;

```
In this updated example:

sum and product demonstrate how you can perform simple arithmetic operations within HexML objects.
result shows how you can reference previously defined values (in this case, sum and age) to calculate a new value.
date demonstrates how you can specify a date value using the <Date(...)> syntax.
To deserialize the above HexML data in JavaScript:

```javascript
const hexmlData = `
  name: "John Doe";
  age: 30;
  isStudent: true;
  grades: <[95, 88, 76]>;
  address: <{
    street: "123 Main St",
    city: "Cityville"
  }>;
  sum: {10 + 5};
  product: {2 * 3};
  result: ={sum + age};
  date: <Date("Sun Oct 01 2023 18:24:38 GMT+0300")>;
`;

const parsedData = hexml.deserialize(hexmlData);
console.log(parsedData);
```
To serialize data into HexML format:

```javascript
const data = {
  name: "John Doe",
  age: 30,
  isStudent: true,
  grades: [95, 88, 76],
  address: {
    street: "123 Main St",
    city: "Cityville"
  },
  sum: 15,
  product: 6,
  result: 45,
  date: new Date("Sun Oct 01 2023 18:24:38 GMT+0300"),
};

const hexmlData = hexml.serialize(data);
console.log(hexmlData);
```

## License 📜
This project is licensed under the Apache-2.0 License - see the LICENSE file for details.