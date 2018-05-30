const Fili = require('fili');
const mind = require('wits');

const channels = ['AF3', 'F7', 'F3', 'FC5', 'T7', 'P7', 'O1', 'O2', 'P8', 'T8', 'FC6', 'F4', 'F8', 'AF4'];

const filteredRecords = {};
channels.forEach(c => filteredRecords[c] = Array(128).fill(0));

var fft = new Fili.Fft(128);
const iirCalculator = new Fili.CalcCascades();

const highpassFilters = channels.map(c => new Fili.IirFilter(iirCalculator.highpass({
  order: 1,
  characteristic: 'butterworth',
  Fs: 128,
  Fc: 3,
})));

const lowpassFilters = channels.map(c => new Fili.IirFilter(iirCalculator.lowpass({
  order: 3,
  characteristic: 'butterworth',
  Fs: 128,
  Fc: 32,
})));

const filter = (filterIndex, data) => {
  return highpassFilters[filterIndex].multiStep(lowpassFilters[filterIndex].multiStep([data]));
}

mind.open();

mind.read(d => {
  channels.forEach((c, i) => {
    if (filteredRecords[c].length > 128) filteredRecords[c].shift();
    filteredRecords[c].push(...filter(i, d.levels[c]));
  });
});

const avg = (data) => data.reduce((i, v) => i + v) / data.length;

module.exports = {
  getForce() {
    const magnitudes = channels.map((c, i) => {
      const fftResult = fft.forward(filteredRecords[c], 'hanning');
      return fft.magnitude(fftResult);
    });

    let datum = Array(magnitudes[0].length).fill(0);

    datum = datum.map((d, i) => {
      return magnitudes.map(e => e[i]).reduce((i, v) => i + v) / magnitudes.length;
    });

    datum = datum.slice(0, 64);
    console.log(avg([datum[9], datum[10], datum[11]]));
    return avg([datum[7], datum[8], datum[9], datum[10], datum[11], datum[12], datum[13]]) > 300 ? 1 : -1;
  }
}



// var svg = d3.select("svg");
// const margin = { top: 20, right: 20, bottom: 30, left: 50 };
// const width = +svg.attr("width") - margin.left - margin.right;
// const height = +svg.attr("height") - margin.top - margin.bottom;
// const g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// const x = d3.scaleLinear()
//   .rangeRound([0, width]);

// const y = d3.scaleLinear()
//   .rangeRound([height, 0]);

// const line = d3.line()
//   .x(function (d) { return x(d.i); })
//   .y(function (d) { return y(d.magnitude); });

// const updateData = () => {
//   const magnitudes = channels.map((c, i) => {
//     const fftResult = fft.forward(filteredRecords[c], 'hanning');
//     return fft.magnitude(fftResult);
//   });

//   let datum = Array(magnitudes[0].length).fill(0);

//   datum = datum.map((d, i) => {
//     return magnitudes.map(e => e[i]).reduce((i, v) => i + v) / magnitudes.length;
//   });

//   datum = datum.map((el, i) => ({ i, magnitude: el })).slice(0, 64);
//   x.domain(d3.extent(datum, function (d) { return d.i; }));
//   y.domain(d3.extent(datum, function (d) { return d.magnitude; }));

//   return datum;
// }


// setInterval(() => {
//   var datum = updateData();

//   var svg = d3.select("body").transition();

//   // Make the changes
//       svg.select(".line")   // change the line
//           .duration(100)
//           .attr("d", line(datum));
//       svg.select(".x.axis") // change the x axis
//           .duration(100)
//           .call(d3.axisBottom(x));
//       svg.select(".y.axis") // change the y axis
//           .duration(100)
//           .call(d3.axisLeft(y));
// }, 300);

// var datum = updateData();

// g.append("g")
//   .attr("transform", "translate(0," + height + ")")
//   .call(d3.axisBottom(x))
//   .attr('class', 'x axis')
//   .select(".domain")
//   .remove();

// g.append("g")
//   .call(d3.axisLeft(y))
//   .attr('class', 'y axis')
//   .append("text")
//   .attr("fill", "#000")
//   .attr("transform", "rotate(-90)")
//   .attr("y", 6)
//   .attr("dy", "0.71em")
//   .attr("text-anchor", "end")
//   .text("Price ($)");

// g.append("path")
//   .attr('class', "line")
//   .datum(datum)
//   .attr("fill", "none")
//   .attr("stroke", "steelblue")
//   .attr("stroke-linejoin", "round")
//   .attr("stroke-linecap", "round")
//   .attr("stroke-width", 1.5)
//   .attr("d", line);
