//select html element where d3 will do its magic
const svg = d3
  .select('.canvas')
  .append('svg')
  .attr('width', 600)
  .attr('height', 600);

// create margins and dimensions
const margin = { top: 20, right: 20, bottom: 100, left: 100 };
const graphWidth = 600 - margin.left - margin.right;
const graphHeight = 600 - margin.top - margin.bottom;

//create graph group and center
const graph = svg
  .append('g')
  .attr('width', graphWidth)
  .attr('height', graphHeight)
  .attr('transform', `translate(${margin.left},${margin.top})`);

//create groups for x and y
const xAxisGroup = graph
  .append('g')
  .attr('transform', `translate(0, ${graphHeight})`);

const yAxisGroup = graph.append('g');

//scales
//create scale for y value -
//this will scale the values in the domain (data set values of 0 to 1000)
//to fit the range 0 to 50
const y = d3.scaleLinear().range([graphHeight, 0]);

//create a band scale for x value -
// this will scale the values based on the number of items in the
// dataset
const x = d3
  .scaleBand()
  .range([0, graphWidth])
  .paddingInner(0.2)
  .paddingOuter(0.2);

// create axes using d3 functions
const xAxis = d3.axisBottom(x);
const yAxis = d3
  .axisLeft(y)
  .ticks(3)
  .tickFormat(d => `${d} orders`);

//update x axis text
xAxisGroup
  .selectAll('text')
  .attr('transform', 'rotate(-40)')
  .attr('text-anchor', 'end')
  .attr('fill', 'orange');

const t = d3.transition().duration(500);

//update function
const update = data => {
  // update scales (domains) if they rely on our data
  y.domain([0, d3.max(data, d => d.orders)]);
  x.domain(data.map(item => item.name));

  // join updated data to elements
  const rects = graph.selectAll('rect').data(data);

  // remove unwanted (if any) shapes using the exit selection
  rects.exit().remove();

  // update current shapes in the dom
  rects
    .attr('width', x.bandwidth)
    .attr('fill', 'orange')
    .attr('x', d => x(d.name));
  //animate bars based on new height and y position if modified
  // .transition(t)
  // .attr('y', d => y(d.orders))
  // .attr('height', d => graphHeight - y(d.orders));

  // append the enter selection to the dom
  rects
    .enter()
    .append('rect')
    .attr('width', 0)
    .attr('height', 0)
    .attr('fill', 'orange')
    .attr('x', d => x(d.name))
    .attr('y', graphHeight)

    //apply following section to both update above and enter selection
    .merge(rects)
    //animate bars upward from zero to starting height and y position
    .transition(t)
    .attrTween('width', widthTween)
    .attr('y', d => y(d.orders))
    .attr('height', d => graphHeight - y(d.orders));

  //call axes
  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);
};

var data = [];

//get data from firestore database
db.collection('dishes').onSnapshot(res => {
  res.docChanges().forEach(change => {
    const doc = { ...change.doc.data(), id: change.doc.id };

    switch (change.type) {
      case 'added':
        data.push(doc);
        break;
      case 'modified':
        const index = data.findIndex(item => item.id == doc.id);
        data[index] = doc;
        break;
      case 'removed':
        data = data.filter(item => item.id !== doc.id);
        break;
      default:
        break;
    }
  });

  update(data);
});

// old update database update that only fires once and does not track changes
// db.collection('dishes')
//   .get()
//   .then(res => {
//     //get data
//     const data = res.docs.map(doc => doc.data());

//     //run update function
//     update(data);

//   });

// TWEENS
const widthTween = d => {
  // define interpolation
  // d3.interpolation returns a function wihich we call 'i'
  let i = d3.interpolate(0, x.bandwidth());

  // return a function which takes in a timer ticker 't'
  return function(t) {
    // return the value from passing the ticker into the interpolation
    return i(t);
  };
};
