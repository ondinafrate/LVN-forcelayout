import { useEffect, useRef, useState } from "react";

import "./App.css";
import * as d3 from "d3";
import { interpolateSpectral, interpolatePRGn } from "d3-scale-chromatic";
import Highlights from "./highlights.json";

function App() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const svgRef = useRef(null);

  const audioRef = useRef(null);

  const svgHeight = 900;
  const svgWidth = Math.max(windowWidth, 800);

  let simulation = d3
    .forceSimulation()
    .force("charge", d3.forceManyBody().strength(0.5))
    .force(
      "x",
      d3.forceX().x(function (d) {
        if (d.type) return d.circleX;
        return svgWidth / 2;
      })
    )
    .force(
      "y",
      d3.forceY().y(function (d) {
        if (d.type) return d.circleY;
        return svgHeight / 2;
      })
    )
    .force(
      "collide",
      d3.forceCollide().radius((d) => {
        if (d.type) return 45;
        return 10 + 1;
      })
    );

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("g").remove();
    const g = svg.append("g").attr("transform", "translate(150,10)");

    let highlights = [...Highlights];

    console.log(highlights.length);

    let i = 0;

    const squareWidth = 10;
    const squareSpacing = 5;

    const xMax = Math.sqrt(highlights.length) + Math.sqrt(highlights.length);

    let minLength = Infinity;
    let maxLength = 0;

    let uniqueTags = new Set();
    highlights.sort((a, b) => {
      var nameA = a.tags[0].split(".")[0].toLowerCase(),
        nameB = b.tags[0].split(".")[0].toLowerCase();
      if (nameA < nameB)
        //sort string ascending
        return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

    highlights.forEach((highlight) => {
      let length = highlight.highlight_end - highlight.highlight_start;
      minLength = Math.min(length, minLength);
      maxLength = Math.max(length, maxLength);
      if (highlight.tags) {
        highlight.tags.forEach((tag) => {
          uniqueTags.add(tag.split(".")[0]);
        });
      }
    });

    console.log(minLength, maxLength);
    console.log(highlights);
    console.log(uniqueTags);

    const durationScale = d3.scaleLog([minLength, maxLength], [5, squareWidth]);

    const tagScale = d3.scalePoint(Array.from(uniqueTags).sort(), [0, 1]);

    let tags = [];

    for (let i = 1; i < 11; i++) {
      let tag = {};
      let circleX = 250 * ((i % 5) + 1);
      let circleY = 100 * (i > 5 ? 8 : 1);

      tag.name = Array.from(uniqueTags)[i - 1];
      tag.circleX = circleX;
      tag.circleY = circleY;
      tag.type = "tag";
      tags.push(tag);
    }

    // highlights = [...highlights, ...tags];

    let node = svg
      .append("g")
      .attr("class", "node")
      .selectAll("circle")
      .data(highlights)
      .enter()
      .append("circle")
      .attr("r", function (d) {
        if (d.type) {
          return 40;
        }
        return durationScale(d.highlight_end - d.highlight_start);
      })
      .attr("fill", function (d) {
        if (d.type) {
          return interpolatePRGn(tagScale(d.name));
        }
        return interpolatePRGn(tagScale(d.tags[0].split(".")[0]));
      })
      .attr("cx", function (d) {
        return 50;
      })
      .attr("cy", function (d) {
        return 50;
      })
      .on("click", (e, d) => {
        // if (d.type) {
        //   tagClick(d);
        // } else {
        d3.selectAll(".highlightRect").attr("stroke", "transparent");
        if (
          audioRef.current.src ===
          "https://app.lvn.org/api/highlights/play/" + d.highlight_id
        ) {
          audioRef.current.src = "";
          audioRef.current.pause();
        } else {
          audioRef.current.src =
            "https://app.lvn.org/api/highlights/play/" + d.highlight_id;
          audioRef.current.play();
          d3.select(".highlightRect.id_" + d.highlight_id)
            .attr("stroke", "red")
            .attr("stroke-width", 2);
        }
        // }
      });

    simulation.nodes(highlights).on("tick", function (d) {
      node
        .attr("cx", function (d) {
          if (d.type) {
            return d.circleX;
          }
          return d.x;
        })
        .attr("cy", function (d) {
          if (d.type) {
            return d.circleY;
          }
          return d.y;
        });
    });

    // function tagClick(tagClicked) {
    //   simulation.alpha(0.6).alphaTarget(0).restart();

    //   simulation
    //     .force(
    //       "x",
    //       d3.forceX().x(function (d) {
    //         if (d.type) return;
    //         const tags = d.tags.map((tag) => tag.split(".")[0].toLowerCase());

    //         if (tags.includes(tagClicked.name)) {
    //           return tagClicked.circleX;
    //         }
    //         return svgWidth / 2;
    //       })
    //     )
    //     .force(
    //       "y",
    //       d3.forceY().y(function (d) {
    //         if (d.type) return;
    //         const tags = d.tags.map((tag) => tag.split(".")[0].toLowerCase());

    //         if (tags.includes(tagClicked.name)) {
    //           return tagClicked.circleY;
    //         }
    //         return svgHeight / 2;
    //       })
    //     );

    //   simulation.force("x").initialize(highlights);
    //   simulation.force("y").initialize(highlights);
    // }

    for (let i = 1; i < 11; i++) {
      let circleX = 250 * ((i % 5) + 1);
      let circleY = 100 * (i > 5 ? 8 : 1);
      const circleG = svg.append("g").attr("transform", function (d) {
        return "translate(" + circleX + "," + circleY + ")";
      });
      circleG
        .append("circle")
        .attr("r", function (d) {
          return 40;
        })
        .attr("fill", function (d) {
          return interpolatePRGn(tagScale(Array.from(uniqueTags)[i - 1]));
        })
        .attr("opacity", 0.5)
        .on("click", () => {
          simulation.alpha(0.6).alphaTarget(0).restart();

          simulation
            .force(
              "x",
              d3.forceX().x(function (d) {
                const tags = d.tags.map((tag) =>
                  tag.split(".")[0].toLowerCase()
                );

                if (tags.includes(Array.from(uniqueTags)[i - 1])) {
                  return circleX;
                }
                return svgWidth / 2;
              })
            )
            .force(
              "y",
              d3.forceY().y(function (d) {
                const tags = d.tags.map((tag) =>
                  tag.split(".")[0].toLowerCase()
                );

                if (tags.includes(Array.from(uniqueTags)[i - 1])) {
                  return circleY;
                }
                return svgHeight / 2;
              })
            );

          simulation.force("x").initialize(highlights);
          simulation.force("y").initialize(highlights);
        });

      circleG
        .append("text")
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .text(Array.from(uniqueTags)[i - 1]);
    }
  }, []);

  return (
    <div className="App">
      <svg ref={svgRef} width={svgWidth} height={svgHeight} />
      <audio id="audio" ref={audioRef}></audio>
    </div>
  );
}

export default App;
