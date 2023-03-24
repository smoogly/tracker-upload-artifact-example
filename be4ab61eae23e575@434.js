import define1 from "./af0ef91929d6bba0@15.js";
import define2 from "./309c76100e0d1941@1257.js";

function _1(md){return(
md`# Design system metrics

Track adoption of your design system using the detailed statistics collected by Radius Tracker, and integrated into an interactive dashboard. See all usages of all components in all your company projects from all sources.`
)}

function _2(md){return(
window.location.hostname.includes('observable') 
? md`
# Sample [Radius Tracker](https://rangle.github.io/radius-tracker) report

This report tracks the adoption of [Grafana UI](https://developers.grafana.com/ui/latest) in [Grafana](https://grafana.com/) main project & its plugin ecosystem. Grafana is an open-source project with a long history and has many open-source plugins — giving us a public example of a design system adoption history.

Stats below are collected using Radius Tracker. [Run Tracker](https://rangle.github.io/radius-tracker/quick_start) on your codebase to get this report for your projects. [Watch React Summit talk](https://www.youtube.com/watch?v=IW21KASz4K8) for details about the stats and the approach to parsing the code.

To better understand how the Tracker can help you measure design system adoption, pretend that Grafana ecosystem is your organization when looking at the report below, that the projects are frontend projects in your company, and that \`grafana\` source represents your design system.
`
: md`
  [Radius Tracker](https://rangle.github.io/radius-tracker) report by [Rangle.io](https://rangle.io/?utm_source=tracker_report)
`
)}

function _3(schemaVersion,expectedSchemaVersion,md,htl){return(
schemaVersion === expectedSchemaVersion ? md`` : md`
# ${ htl.html`<span style="color: red;">Database schema version mismatch</span>` }

This likely means that you're attaching a database of an old format to an updated report. Please update Radius Tracker package to latest version, or use an older version of the report.
`
)}

function _4(collectedAt,htl,md){return(
md`# Component usages as of ${ collectedAt.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric" }) }

If you're not sure how to use this report, see the ${ htl.html`<a href="#dashboard-intro" onclick=${ () => document.querySelector("#dashboard-intro").scrollIntoView() }>Dashboard Intro</a>` } below.`
)}

function _selectedMetric(render,jsx,MetricSelector,isSingleSource){return(
render(({ useSetter }) => jsx`<${ MetricSelector } useSetter=${ useSetter } isSingleSource=${ isSingleSource }/>`)
)}

function _6(width,collectedAt,selectedMetric,MetricSelector,filteredUsageCountBySource,d3,Plot,homebrewSourceId,colorScales,isSingleSnapshot,allSources,isSingleSource,filteredReuseBySource,positionSegments,filteredUsageCountByComponent,allComponents,maxComponentsForPerComponentUsage)
{
  const labelHeight = 10; // px
  const chartHeight = Math.min(400, width / 1.5);
  const chartWidth = width - Math.min(100, width / 10);

  const curve = "step-before";
  const timeScale = d => {
    // Snapshots are taken each Saturday, except for the latest commit
    // https://github.com/rangle/radius-tracker/blob/46fb00879bbf752904d6dcf723687d67bff6f342/src/lib/cli/timelines/getTimelineForOneRepo.ts#L75
    if (d.weeksAgo === 0) { return collectedAt; }

    const date = new Date(collectedAt.toISOString().split("T")[0] + "T00:00:00.000Z");
    date.setDate(date.getDate() - 7 * d.weeksAgo - (date.getDay() + 1) % 7);

    return date;
  };
  
  switch (selectedMetric) {
    case MetricSelector.Metrics.share:
    case MetricSelector.Metrics.absolute: {
      const isShareChart = selectedMetric === MetricSelector.Metrics.share;
      const lastWeekData = filteredUsageCountBySource.filter(x => x.weeksAgo === 0);
      const sourceBySize = lastWeekData
        .sort((a, b) => d3.ascending(a.usages, b.usages))
        .map(x => x.source);
      
      const usagesLastWeek = lastWeekData.reduce((tot, x) => tot + x.usages, 0);
      const proportionSize = lastWeekData.reduce((set, x) => { 
        set[x.source] = x.usages / usagesLastWeek;
        return set;
      }, {});
      
      const channel = Plot.stackY({ 
        offset: isShareChart ? "expand" : undefined, 
        x: timeScale, 
        y: "usages", 
        z: "source",
        fill: d => !isShareChart && d.source === homebrewSourceId.id ? colorScales.homebrewColor : colorScales.chart(d.source), 
        order: d => d.source === homebrewSourceId.id ? Infinity : sourceBySize.indexOf(d.source), 
        curve,
      });
    
      return Plot.plot({
        caption: isShareChart ? 'Share of selected components over time' : 'Usages of selected components over time',
        style: "overflow: visible",
        grid: true,
        width: chartWidth,
        height: chartHeight,
        y: isShareChart ? { domain: [0, 1], tickFormat: "%", label: "↑ Design System share" } : { label: "↑ Usages" },
        marks: [
          Plot.ruleY([0]),
          !isSingleSnapshot ? Plot.areaY(filteredUsageCountBySource, channel) : null,  
          isSingleSnapshot ? Plot.barY(filteredUsageCountBySource, channel) : null,
          Plot.text(filteredUsageCountBySource, Plot.selectFirst({
            ...channel,
            fill: "black",
            text: d => { 
              const name = allSources.find(s => s.id === d.source)?.name;
              if (!name) { throw new Error(`Can not find souce with id ${ d.source }`); }
              if (isSingleSource) { return name; }
              return chartHeight * proportionSize[d.source] >= labelHeight ? name : undefined;
            },
            textAnchor: isSingleSnapshot ? "center" : "start",
            dx: isSingleSnapshot ? 0 : 3
          }))
        ]
      });
    }
      
    case MetricSelector.Metrics.reuse: {
      const lastPointPerSource = Object.values(
        filteredReuseBySource.reduce((set, one) => {
          if (!(one.source in set) || set[one.source].weeksAgo > one.weeksAgo) {
            set[one.source] = one;
          }

          return set;
        }, {})
      );

      // Some lines end in the past - when component stopped being used.
      // To render this appropriately, we add a point to the set at `weeksAgo: 0` at 0 value
      const extendedReuseBySource = [
        ...lastPointPerSource.filter(x => x.weeksAgo !== 0).flatMap(x => [
          // At week 0 the value is 0
          { ...x, weeksAgo: 0, reuse: 0 },

          // Point following the last point is 0 so that the line would step-down correctly
          { ...x, weeksAgo: x.weeksAgo - 1, reuse: 0 }, 
        ]),
        ...filteredReuseBySource, 
      ];

      const updatedLastPoints = extendedReuseBySource.filter(x => x.weeksAgo === 0);
      
      const yExtent = [0, Math.max(...extendedReuseBySource.map(d => d.reuse), 0)];
      const verticalScale = d3.scaleLinear() // Approximate scale of the chart
        .domain(yExtent)
        .range([0, chartHeight])
        .nice();
      const positionedLabels = positionSegments(updatedLastPoints.map(item => ({ 
        ...item, 
        center: verticalScale(item.reuse), 
        width: labelHeight,
      })));

      const channel = {
        x: timeScale,
        y: "reuse",
        z: "source",
        stroke: d => colorScales.standalone(d.source),
        curve,
      };
      return Plot.plot({
        caption: "Average component reuse by source",
        style: "overflow: visible",
        grid: true,
        width: chartWidth,
        height: chartHeight,
        y: { domain: yExtent, label: "↑ Average reuse" },
        x: isSingleSnapshot ? { interval: d3.utcDay } : undefined,
        marks: [
          Plot.ruleY([0]),
          !isSingleSnapshot ? Plot.line(extendedReuseBySource, channel) : null,  
          isSingleSnapshot ? Plot.dotY(extendedReuseBySource, Plot.dodgeX({ ...channel, fill: channel.stroke, anchor: "middle" })) : null,
          Plot.text(extendedReuseBySource, Plot.selectFirst({
            ...channel,
            stroke: undefined,
            fill: "black",
            text: (d) => { 
              const name = allSources.find(s => s.id === d.source)?.name;
              if (!name) { throw new Error(`Can not find souce with id ${ d.source }`); }
              return name;
            },
            textAnchor: "start",
            dx: isSingleSnapshot ? 5 : 3,
            dy: labelHeight / 2,
            y: d => {
              const point = positionedLabels.find(x => x.ref.source === d.source);
              if (!point) { throw new Error(`Can not find a positioned label for source ${ d.source }`) };
              return verticalScale.invert(point.end);
            }
          }))
        ]
      });
    }

    case MetricSelector.Metrics.components:
      const lastPointPerComponent = Object.values(
        filteredUsageCountByComponent.usages.reduce((set, one) => {
          if (!(one.component in set) || set[one.component].weeksAgo > one.weeksAgo) {
            set[one.component] = one;
          }

          return set;
        }, {})
      );

      // Some lines end in the past - when component stopped being used.
      // To render this appropriately, we add a point to the set at `weeksAgo: 0` at 0 value
      const extendedReuseByComponent = [
        ...lastPointPerComponent.filter(x => x.weeksAgo !== 0).flatMap(x => [
          // At week 0 the value is 0
          { ...x, weeksAgo: 0, usages: 0 },

          // Point following the last point is 0 so that the line would step-down correctly
          { ...x, weeksAgo: x.weeksAgo - 1, usages: 0 }, 
        ]),
        ...filteredUsageCountByComponent.usages, 
      ];
      
      const yExtent = [0, Math.max(d3.max(extendedReuseByComponent, x => x.usages), 0)];
      const verticalScale = d3.scaleLinear() // Approximate scale of the chart
        .domain(yExtent)
        .range([0, chartHeight])
        .nice();

      const updatedLastPoints = extendedReuseByComponent
        .filter(x => x.weeksAgo === 0)
        .map(item => ({ 
          ...item, 
          center: verticalScale(item.usages), 
          width: labelHeight,
        }))
        .sort((a, b) => d3.descending(a.center, b.center));

      let _labelPositions = [];
      let i = updatedLastPoints.length;
      const maxGroupedItems = 5;
      while (i--) {
        const nextPositions = positionSegments(updatedLastPoints.slice(0, updatedLastPoints.length - i).map(item => ({ ...item })));
        const nextlabelGroups = d3.rollup(nextPositions, g => g.length, x => x.group);
        if ([...nextlabelGroups.values()].some(x => x > maxGroupedItems)) {
          break;
        }

        _labelPositions = nextPositions;
      }

      const positionedLabels = d3.index(_labelPositions, x => x.ref.component);

      const componentsById = d3.index(allComponents, x => x.id);
      const channel = {
        x: timeScale,
        y: "usages",
        z: "component",
        stroke: d => colorScales.standalone(d.source),
        opacity: d => positionedLabels.has(d.component) ? 1 
          : filteredUsageCountByComponent.exact_components ? 0.5
          : 0.1,
        curve,
      };
      return Plot.plot({
        caption: `Individual component usages over time ${!filteredUsageCountByComponent.exact_components ? `(showing top ${ maxComponentsForPerComponentUsage } components by usage at the last snapshot)` : ''}`,
        style: "overflow: visible",
        grid: true,
        width: chartWidth,
        height: chartHeight,
        x: isSingleSnapshot ? { interval: d3.utcDay } : undefined,
        marks: [
          Plot.ruleY([0]),
          !isSingleSnapshot ? Plot.lineY(extendedReuseByComponent, channel) : null,
          isSingleSnapshot ? Plot.dotY(filteredUsageCountByComponent.usages, Plot.dodgeX({ ...channel, fill: channel.stroke, anchor: "middle" })) : null,
          Plot.text(extendedReuseByComponent, Plot.selectFirst({
            ...channel,
            stroke: undefined,
            fill: "black",
            text: (d) => {
              const point = positionedLabels.get(d.component);
              if (!point) { return undefined; }
              return componentsById.get(d.component).name;
            },
            textAnchor: "start",
            dx: isSingleSnapshot ? 5 : 3,
            dy: labelHeight / 2,
            y: d => {
              const point = positionedLabels.get(d.component);
              return point ? verticalScale.invert(point.end) : 0;
            }
          }))
        ]
      })

    default:
      throw new Error(`Unhandled metric ${ selectedMetric }`);
  }
}


function _selectedFilters(render,jsx,FiltersComponent,sourcesData,projectData,componentData){return(
render(({ useSetter }) => {
  return jsx`<${ FiltersComponent } useSetter=${ useSetter } sources=${ sourcesData } projects=${ projectData } components=${ componentData }/>`;
})
)}

function _8(htl){return(
htl.html`<div style="height: 50px"/>`
)}

function _9(debouncedSelectedFilters,md,allProjects,latest_usages_by_file,d3,width,htl)
{
  if (debouncedSelectedFilters.selectedProjects.length !== 1) { return md`Select a single project to view usages across project files`; }

  const title = `## Selected component usages across the files in ${ allProjects.find(p => p.id === debouncedSelectedFilters.selectedProjects[0]).name }`;

  if (latest_usages_by_file.length === 0) { return md`
${ title }
No usages found for selected components
  `; }
  
  const filetree = d3.hierarchy(d3.stratify().path(d => d.file)(latest_usages_by_file))
    .sum(node => node.data?.usages ?? 0)
    .sort((a, b) => b.value - a.value)
    .each(node => {
      node.label = node.data.id.split("/").pop() || "/"
    });

  filetree.each(node => node.open = false);
  filetree.open = true; // Root node open
  
  const rowHeight = 20;
  const textBottomOffset = 5;
  const levelOffset = 10;
  const textToBarOffset = 3;
  
  const maxBarWidth = 100;
  const numberCellWidth = filetree.value.toString().length * 10;
  const valueScale = d3.scaleLinear()
    .domain([0, filetree.value])
    .range([maxBarWidth, 0]);

  const render = (subtree, position) => {
    const children = subtree.open ? (subtree.children ?? []).map((c, idx) => render(c, position + 1)) : [];

    const scaledValue = valueScale(subtree.value)
    const bar = d3.create("svg:rect")
      .attr("x", scaledValue)
      .attr("width", maxBarWidth - scaledValue)
      .attr("y", 0)
      .attr("height", rowHeight - 1)
      .attr("style", "font-family: monospace;")
      .attr("fill", "#D44527");

    const valueText = d3.create("svg:text");
    valueText
      .text(subtree.value)
      .attr("text-anchor", "end")
      .attr("x", maxBarWidth + numberCellWidth + textToBarOffset)
      .attr("y", rowHeight - textBottomOffset)
      .attr("fill", "black");

    const dots = d3.create("svg:line");
    dots
      .attr("class", "dots")
      .attr("x1", maxBarWidth + numberCellWidth + 2 * textToBarOffset)
      .attr("x2", maxBarWidth + numberCellWidth + 1 * textToBarOffset + levelOffset * position)
      .attr("y1", rowHeight / 2)
      .attr("y2", rowHeight / 2)
      .attr("stroke-dasharray", "1 1")
      .attr("stroke", "#ccc")
      .attr("style", "display: none;");
    
    const label = d3.create("svg:text")
    label
      .text(`${ subtree.open ? "– " : (subtree.children?.length ?? 0) > 0 ? "+ " : "" }${ subtree.label }`)
      .attr("x", maxBarWidth + numberCellWidth + 2 * textToBarOffset + levelOffset * position)
      .attr("y", rowHeight - textBottomOffset)
      .attr("fill", "black");

    const group = d3.create("svg:g")
      .attr("class", "row")
      .attr("style", `cursor: ${ subtree.children?.length ? "pointer" : "default" };`);
    group.node().append(valueText.node());
    group.node().append(label.node());
    group.node().append(dots.node());
    group.node().append(bar.node());

    group.on("click", event => {
      event.stopPropagation();
      if ((subtree.children?.length ?? 0) < 1) { return; }
      
      subtree.open = !subtree.open;
      if (!subtree.open) { subtree.each(x => x.open = false); }
      
      rerender();
    });

    let runningOffset = rowHeight;
    children.forEach(({ size, element }) => {
      group.append("svg:g")
        .attr("transform", `translate(0, ${ runningOffset })`)
        .node().append(element);
    
      runningOffset += size;
    });

    return { size: children.reduce((tot, c) => tot + c.size, rowHeight), element: group.node(), content: { self: subtree.data.id, children: children.map(c => c.content) } };
  };

  const wrapper = d3.create("div");
  function rerender() {
    const rendered = render(filetree, 0);
    
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", rendered.size)
        .attr("viewBox", [0, 0, width, rendered.size])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.node().append(d3.create("svg:style").text(".row:hover > .dots { display: block !important; }").node());
    svg.node().append(rendered.element);  

    wrapper.node().innerHTML = "";
    wrapper.node().append(svg.node());
  }

  rerender();
  return htl.html`
    ${ md`${ title }`}
    ${ wrapper.node() }
  `;
}


function _10(htl){return(
htl.html`<div style="height: 200px"/>`
)}

function _11(md){return(
md`# Dashboard Intro`
)}

function _12(Generators,html,DOM,MutationObserver){return(
Generators.observe(notify => {
  const startHeading = "Dashboard Intro";
  const endHeading = "Appendix";
  
  let prevHeadings = [];
  function observed() {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
    if (headings.length !== prevHeadings.length || headings.some((h, i) => prevHeadings[i] !== h)) {
      prevHeadings = headings;

      const startIdx = headings.findIndex(h => h.textContent === startHeading);
      const endIdx = headings.findIndex(h => h.textContent === endHeading);
      const headingContents = headings
        .slice(startIdx + 1, endIdx)
        .map(h => ({
          level: Number(h.tagName.replace(/^H/i, "")),
          el: h,
        }));

      const minLevel = Math.min(...headingContents.map(h => h.level));
      notify(html`
        <style>
          .t-toc { 
            list-style-type: none;
            padding: 0;
          }

          .t-toc-0 {
            font-size: 120%;
            font-weight: 500;
          }
          .t-toc-1 {
            padding-left: 20px;
          }
          .t-toc-2 {
            padding-left: 40px;
          }
        </style>
        <ul class="t-toc">
          ${headingContents.map(h => {
            return Object.assign(
              html`<li class="t-toc-${h.level - minLevel}"><a href=#${h.el.id}>${DOM.text(h.el.textContent)}</a></li>`,
              {onclick: e => (e.preventDefault(), h.el.scrollIntoView())}
            );
          })}
        </ul>
      `);
    }
  }

  const observer = new MutationObserver(observed);
  observer.observe(document.body, {childList: true, subtree: true});
  observed();
  return () => observer.disconnect();
})
)}

function _13(md){return(
md`## Usages

This report tracks _individual usages_ of components in an ecosystem.

Developers use the UI components by referencing them in code to build the products. Every such usage is introduced in a particular place in code by a particular author in a particular commit at a certain point in time and references a particular component from a particular source.

\`\`\`js
import { Component } from "@enterprise/design-system";
//       ^^^ Component     ^^^ Source

export const ProductThing = () => <Component/>;
//                                 ^^^ Usage
\`\`\`


## Projects and Sources

An ecosystem within the enterprise is all the projects with customer-facing UI. Those projects use a mix of component sources: design system, other in-house and third-party component libraries, and custom components implemented directly in the codebases of these projects.

The team defines projects and sources in the [tracker configuration](https://rangle.github.io/radius-tracker/configuration_file) before analyzing the codebase.


### Homebrew source

Homebrew is a special source tracking low-level components implemented directly in the project codebase.

Developers routinely compose product UI out of low-level components, so not every component in the project codebase is considered 'homebrew'. Tracker ignores components built entirely using _other components,_ and only includes components outputting raw markup as 'homebrew'.

[comment]: <> (TODO: fix highlighting for JSX tags)
\`\`\`
const HomebrewButton = ({ children }) => <button>{ children }</button>;
//    ^^^ Homebrew component              ^^^ Uses low-level HTML markup

const CompositionalComponent = () => <HomebrewButton>Click me</HomebrewButton>
//    ^^^ Not homebrew, because it only uses other components
\`\`\`


## Components

When the Tracker analyzes a project, it almost never has access to the definition of a component. That is why Tracker uses imports as a starting point for finding usages. It relies on the component name and source to determine if the same component is used across different projects. This way, the imports shown below result in two 'Button' components in the component list, each with different source.

\`\`\`js
import { Button } from "lib"
import { Button } from "another-lib"
\`\`\``
)}

function _14(md){return(
md`## Working with filters

You can filter the stats by choosing which sources, projects, and components to include.

`
)}

function _15(render,useState,jsx,SelectableItemList)
{ 
  const items = [
    { id: 'dashboard', name: 'Dashboard', overallMetric: '', metricBreakdown: [], disabled: false },
    { id: 'profile', name: 'Profile', overallMetric: '', metricBreakdown: [], disabled: false },
    { id: 'authentication', name: 'Authentication', overallMetric: '', metricBreakdown: [], disabled: false },
    { id: 'billing', name: 'Billing', overallMetric: '', metricBreakdown: [], disabled: false },
  ];
  
  return render(() => {
    const [selected, setSelected] = useState(items.map(i => i.id));
    return jsx`
      <style>.t-filters-demo-plain { max-width: 350px; }</style>
      <div className="t-filters-demo-plain">
        <${ SelectableItemList }
          name="Projects"
          filterPlaceholder="Filter projects..."
          onSelectionChange=${ setSelected }
          items=${ items }/>
      </div>
    `;
  });
}


function _16(md){return(
md`### Greyed-out items

Filters affect other filters, so some choices might be greyed out. For example, components outside of selected sources will not appear in the stats, so choosing them has no impact on the displayed data. Choice of greyed-out components, however, impacts other filters.`
)}

function _17(render,useState,jsx,SelectableItemList)
{ 
  const items = [
    { id: 'dashboard', name: 'Dashboard', overallMetric: '', metricBreakdown: [], disabled: false },
    { id: 'profile', name: 'Profile', overallMetric: '', metricBreakdown: [], disabled: false },
    { id: 'authentication', name: 'Authentication', overallMetric: '', metricBreakdown: [], disabled: true },
    { id: 'billing', name: 'Billing', overallMetric: '', metricBreakdown: [], disabled: true },
  ];
  
  return render(() => {
    const [selected, setSelected] = useState(items.map(i => i.id));
    return jsx`
      <style>.t-filters-demo-disabled { max-width: 350px; }</style>
      <div className="t-filters-demo-disabled">
        <${ SelectableItemList }
          name="Projects"
          filterPlaceholder="Filter projects..."
          onSelectionChange=${ setSelected }
          items=${ items }/>
      </div>
    `;
  });
}


function _18(md){return(
md`### Active item count

The number at the top of a list shows how many items are currently selected and active. This is useful, for example, to quickly check how many projects are using a particular source. In the list below only the 'Design System' source is selected, and so only the projects utilizing that source are highlighted. The rest are disabled, and excluded from the total count.`
)}

function _19(render,useState,jsx,SelectableItemList)
{ 
  const sources = [
    { id: 'ds', name: 'Design System', overallMetric: '', metricBreakdown: [], disabled: false },
    { id: 'homebrew', name: 'Homebrew', overallMetric: '', metricBreakdown: [], disabled: false },
  ]
  const projects = [
    { id: 'dashboard', name: 'Dashboard', overallMetric: '', metricBreakdown: [], disabled: false },
    { id: 'profile', name: 'Profile', overallMetric: '', metricBreakdown: [], disabled: false },
    { id: 'authentication', name: 'Authentication', overallMetric: '', metricBreakdown: [], disabled: true },
    { id: 'billing', name: 'Billing', overallMetric: '', metricBreakdown: [], disabled: true },
  ];

  const columnGap = 40;
  return render(() => {
    const [selectedSources, setSelectedSources] = useState([sources[0].id]);
    const [selectedProjects, setSelectedProjects] = useState(projects.map(i => i.id));
    return jsx`
      <style>
        .t-filters-demo-cross-counting {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          margin-bottom: -40px;
        }
        .t-filters-demo-cross-counting-item {
          flex: 0 0 calc(33% - ${ 2 * columnGap / 3 }px);
          width: calc(33% - ${ 2 * columnGap / 3 }px);
          min-width: 250px;
          margin-bottom: 40px;
        }
        .t-filters-demo-cross-counting-item:not(:last-child) {
          margin-right: ${columnGap}px;
        }
      </style>
      <div className="t-filters-demo-cross-counting">
        <div className="t-filters-demo-cross-counting-item">
          <${ SelectableItemList }
            name="Sources"
            filterPlaceholder=""
            onSelectionChange=${ setSelectedSources }
            initialSelection=${ selectedSources }
            items=${ sources }/>
        </div>
        <div className="t-filters-demo-cross-counting-item">
          <${ SelectableItemList }
            name="Projects"
            filterPlaceholder=""
            onSelectionChange=${ setSelectedProjects }
            items=${ projects }/>
        </div>
      </div>
    `;
  });
}


function _20(md){return(
md`### Item stats

Filters also give a brief overview of individual impact of each source, project, and component.

Numbers in each line represent the total number of component usages matching the criteria, as of the latest snapshot (rightmost tick on the chart).
* For a source — a total number of usages of all components from that source.
* For a project — a number of usages of selected components in that project.
* For a component — a number of times that component is used.

Chart on the right shows comparative impact of each source on the item. The values are scaled in proportion to the biggest number of usages of a single item.`
)}

function _21(colorScales,homebrewSourceId,render,useState,jsx,SelectableItemList)
{ 
  const homebrewColor = colorScales.standalone(homebrewSourceId.id);
  const targetColor = colorScales.standalone(homebrewSourceId.id + 1);
  const otherColor = colorScales.standalone(homebrewSourceId.id + 2);
  const items = [
    { id: 'dashboard', name: 'Dashboard', overallMetric: '1337', metricBreakdown: [
      { type: 'homebrew', color: homebrewColor, percentage: 30 },
      { type: 'target', color: targetColor, percentage: 50 },
      { type: 'other', color: otherColor, percentage: 20 },
    ], disabled: false },
    { id: 'profile', name: 'Profile', overallMetric: '1137', metricBreakdown: [
      { type: 'homebrew', color: homebrewColor, percentage: 25 },
      { type: 'target', color: targetColor, percentage: 20 },
      { type: 'other', color: otherColor, percentage: 40 },
    ], disabled: false },
    { id: 'authentication', name: 'Authentication', overallMetric: '936', metricBreakdown: [
      { type: 'homebrew', color: homebrewColor, percentage: 40 },
      { type: 'target', color: targetColor, percentage: 20 },
      { type: 'other', color: otherColor, percentage: 10 },
    ], disabled: false },
    { id: 'billing', name: 'Billing', overallMetric: '468', metricBreakdown: [
      { type: 'homebrew', color: homebrewColor, percentage: 15 },
      { type: 'target', color: targetColor, percentage: 20 },
    ], disabled: false },
  ];
  
  return render(() => {
    const [selected, setSelected] = useState(items.map(i => i.id));
    return jsx`
      <style>.t-filters-demo-stats { max-width: 350px; }</style>
      <div className="t-filters-demo-stats">
        <${ SelectableItemList }
          name="Projects"
          filterPlaceholder="All"
          onSelectionChange=${ setSelected }
          items=${ items }/>
      </div>
    `;
  });
}


function _22(md){return(
md`The bars have a minimum width to prioritize showing a composition of an item over the proportions. On the lower end of the scale you might see an unexpected artifact, it is there to let you know which sources are represented in an item:`
)}

function _23(colorScales,homebrewSourceId,render,useState,jsx,SelectableItemList)
{ 
  const homebrewColor = colorScales.standalone(homebrewSourceId.id);
  const targetColor = colorScales.standalone(homebrewSourceId.id + 1);
  const otherColor = colorScales.standalone(homebrewSourceId.id + 2);
  const items = [
    { id: 'big', name: 'Big project', overallMetric: '1000', metricBreakdown: [
      { type: 'homebrew', color: homebrewColor, percentage: 30 },
      { type: 'target', color: targetColor, percentage: 50 },
      { type: 'other', color: otherColor, percentage: 20 },
    ], disabled: false },
    { id: 'tiny1', name: 'Tiny project', overallMetric: '50', metricBreakdown: [
      { type: 'homebrew', color: homebrewColor, percentage: 10 },
    ], disabled: false },
    { id: 'tiny2', name: 'Tinier project', overallMetric: '30', metricBreakdown: [
      { type: 'homebrew', color: homebrewColor, percentage: 10 },
      { type: 'target', color: targetColor, percentage: 10 },
    ], disabled: false },
    { id: 'tiny3', name: 'Extra tiny', overallMetric: '1', metricBreakdown: [
      { type: 'other', color: otherColor, percentage: 10 },
    ], disabled: false },
  ];
  
  return render(() => {
    const [selected, setSelected] = useState(items.map(i => i.id));
    return jsx`
      <style>.t-filters-demo-min-stats { max-width: 350px; }</style>
      <div className="t-filters-demo-min-stats">
        <${ SelectableItemList }
          name="Projects"
          filterPlaceholder="All"
          onSelectionChange=${ setSelected }
          items=${ items }/>
      </div>
    `;
  });
}


function _24(md){return(
md`### Filtering by name

Finally, you can narrow down projects and components filtering by name. Filtering the list affects the selection. This is useful, for example, to find all 'Button' components in the list from all sources.`
)}

function _25(colorScales,homebrewSourceId,render,useState,jsx,SelectableItemList)
{ 
  const homebrewColor = colorScales.standalone(homebrewSourceId.id);
  const targetColor = colorScales.standalone(homebrewSourceId.id + 1);
  const otherColor = colorScales.standalone(homebrewSourceId.id + 2);
  const items = [
    { id: 'button1', name: 'Button', overallMetric: '1337', metricBreakdown: [
      { type: 'target', color: targetColor, percentage: 100 },
    ], disabled: false },
    { id: 'button2', name: 'Button', overallMetric: '1137', metricBreakdown: [
      { type: 'homebrew', color: homebrewColor, percentage: 85 },
    ], disabled: false },
    { id: 'button3', name: 'Button', overallMetric: '936', metricBreakdown: [
      { type: 'other', color: otherColor, percentage: 70 },
    ], disabled: false },
    { id: 'card', name: 'Card', overallMetric: '468', metricBreakdown: [
      { type: 'target', color: targetColor, percentage: 35 },
    ], disabled: false },
    { id: 'tooltip', name: 'Tooltip', overallMetric: '138', metricBreakdown: [
      { type: 'homebrew', color: homebrewColor, percentage: 10 },
    ], disabled: false },
  ];
  
  return render(() => {
    const [selected, setSelected] = useState(items.map(i => i.id));
    return jsx`
      <style>.t-filters-demo-filtered { max-width: 350px; }</style>
      <div className="t-filters-demo-filtered">
        <${ SelectableItemList }
          name="Projects"
          filterPlaceholder="All"
          isFiltered
          onSelectionChange=${ setSelected }
          initialFilterStr="Button"
          items=${ items }/>
      </div>
    `;
  });
}


function _26(htl){return(
htl.html`<div style="height: 500px"/>`
)}

function _27(md){return(
md`# Appendix

Cells below are implementation details of the report.`
)}

function _expectedSchemaVersion(){return(
"2"
)}

function _29(md){return(
md`## Strict require calls

Forcing strict enumeration of resources required using stdlib.require.
This helps make the report self-contained when generating the report locally.`
)}

function _knownExternalResources(){return(
[
  // Observable stdlib
  "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6.4/dist/plot.umd.min.js",
  "https://cdn.jsdelivr.net/npm/d3@7.8.2/dist/d3.min.js",
  "https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js",
  "https://cdn.jsdelivr.net/npm/marked@0.3.12/marked.min.js",
  "https://cdn.jsdelivr.net/npm/htl@0.3.1/dist/htl.min.js",
  "https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.js",
  "https://cdn.jsdelivr.net/npm/sql.js@1.8.0/dist/sql-wasm.wasm",
  "https://cdn.jsdelivr.net/npm/@observablehq/highlight.js@2.0.0/highlight.min.js",

  // React related
  "https://cdn.jsdelivr.net/npm/classnames@2.3.2/index.js",
  "https://cdn.jsdelivr.net/npm/htm@2.2.1/dist/htm.umd.js",
  "https://cdn.jsdelivr.net/npm/@observablehq/inspector@5.0.0/dist/inspector.js",
  "https://unpkg.com/react@18.2.0/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js",
  "https://cdn.jsdelivr.net/npm/react-window@1.8.8/dist/index-prod.umd.js",
]
)}

function _isUrl(){return(
(str) => {
  let url;
  try {
    url = new URL(str);
  } catch(e) {
    return false; // Couldn't construct url
  }

  return url.href === str;
}
)}

function _require(d3Require,isUrl,knownExternalResources){return(
d3Require.requireFrom(async (name, base) => {
  const resolved = isUrl(name) ? name : await d3Require.require.resolve(name, base);
  if (!knownExternalResources.includes(resolved)) {
    throw new Error(`Unknown require resource. Please add it to knownExternalResources list, so that they can be statically resolved for report archival: ${ resolved }`);
  }

  return resolved;
})
)}

function _34(md){return(
md`## UI components`
)}

function _reactDevMode(){return(
false
)}

function _reactVersion(){return(
"18.2.0"
)}

function _reactWindow(require,React)
{
  const presetRequire = require.alias({
    "react": React,
  });
  
  return presetRequire('react-window@1.8.8/dist/index-prod.umd.js')
}


function _classnames(require){return(
require('classnames@2.3.2/index.js')
)}

function _Collapsible(component,useState,useCallback,jsx){return(
component(({ children, label }) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(x => !x), [setOpen]);
  return jsx`
    <style>.collapsible-toggle { cursor: pointer; border-bottom: 1px dashed black; }</style>
    <div >
      ${ open ? jsx`<div><span className="collapsible-toggle" onClick=${ toggle }>Close</span></div>` : null }
      ${ open ? children : jsx`<span className="collapsible-toggle" onClick=${ toggle }>${ label ?? "Show" }</span>` }
    </div>
  `;
})
)}

function _NBSP(component,jsx){return(
component(() => jsx`${ ' ' /* nbsp literal */ }`)
)}

function _SearchIcon(component,jsx){return(
component(() => jsx`<svg style=${{width: '20px', height: '20px', position: 'relative', top: '3px'}}
xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
<path d="M10.2583 9.66665H10.9166L15.075 13.8333L13.8333 15.075L9.66663 10.9167V10.2583L9.44163 10.025C8.49163 10.8417 7.25829 11.3333 5.91663 11.3333C2.92496 11.3333 0.499958 8.90832 0.499958 5.91665C0.499958 2.92499 2.92496 0.499985 5.91663 0.499985C8.90829 0.499985 11.3333 2.92499 11.3333 5.91665C11.3333 7.25832 10.8416 8.49165 10.025 9.44165L10.2583 9.66665ZM2.16662 5.91665C2.16662 7.99165 3.84163 9.66665 5.91663 9.66665C7.99163 9.66665 9.66663 7.99165 9.66663 5.91665C9.66663 3.84165 7.99163 2.16665 5.91663 2.16665C3.84163 2.16665 2.16662 3.84165 2.16662 5.91665Z" fill="#262626"/>
</svg>`)
)}

function _43(render,jsx,SearchIcon){return(
render(() => jsx`<${ SearchIcon }/>`)
)}

function _ClearIcon(component,jsx){return(
component(({ onClick }) => jsx`<svg style=${{width: '16px', height: '16px', position: 'relative', top: '3px'}} 
onClick=${ onClick }
xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
<path d="M11.8333 1.34165L10.6583 0.166653L5.99999 4.82499L1.34166 0.166653L0.166656 1.34165L4.82499 5.99999L0.166656 10.6583L1.34166 11.8333L5.99999 7.17499L10.6583 11.8333L11.8333 10.6583L7.17499 5.99999L11.8333 1.34165Z" fill="#012E86"/>
</svg>`)
)}

function _45(render,jsx,ClearIcon){return(
render(() => jsx`<${ ClearIcon }/>`)
)}

function _FilterInputComponent(component,useCallback,jsx,ClearIcon,SearchIcon){return(
component(({ value, onChange, placeholder }) => {
  const hasContent = value.trim().length > 0;
  const onChangeHandler = useCallback(e => onChange(e.target.value), [onChange]);
  const onClearHandler = useCallback(() => onChange(''), [onChange]);
  
  return jsx`
    <style>
      .t-filter-input {
        position: relative;
        display: inline-block;
        vertical-align: baseline;
        cursor: text;
        box-sizing: border-box;
        border: 1px solid transparent;
        padding: 11.6px 14px;
      }

      .t-filter-input-left, .t-filter-input-right {
        z-index:10;
        height: 20px;
        position: relative;
        cursor: default;
      }
      .t-filter-input-right {
        float: right;
        padding-left: 14px;
      }
      .t-filter-input-left {
        float: left;
        padding-right: 14px;
      }

      .t-filter-input-wrapper {
        display: block;
        overflow: hidden;
        height: 100%;
      }

      .t-filter-input-controller:is(input) {
        z-index: 10;

        line-height: 20px;
        font-size: 16px;
        font-family: inherit;

        width: 100%;
        
        padding:0;
        margin:0;
        border: none;
        background: transparent;
        appearance: none;
        position: relative;
        display: inline-block;
        vertical-align: baseline;
        box-sizing: border-box;
        max-width: 100%;
        width: 100%;
        cursor: text;
        outline: none;
      }

      .t-filter-input-view {
        position: absolute;
        top: -1px;
        left: -1px;
        right: -1px;
        bottom: -1px;
        border: 1px solid black;
        border-radius: 1px;
        background: #fff;
        appearance: none;
      }
      .t-filter-input-controller:focus + .t-filter-input-view {
        outline: solid 2px #db7c00;
        outline-offset: 1px;
      }

      .t-filter-input-placeholder {
        position: relative;
        display: block;
        height: 0;
      }
      .t-filter-input-placeholder-inner {
        line-height: 20px;
        font-size: 16px;

        position: absolute;
        z-index: 10;
        top: 2px; // TODO: this should be -1px matching the border width. Figure out why the placeholder is offset.
        left: -1px;
        box-sizing: border-box;
        border: 1px solid transparent;
        pointer-events: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    </style>
    <div className="t-filter-input">
      ${ hasContent ? jsx`<span className="t-filter-input-right"><${ClearIcon} onClick=${ onClearHandler }/></span>` : null }
      <span className="t-filter-input-left"><${SearchIcon}/></span>
      <label className="t-filter-input-wrapper">
        ${ !hasContent ? jsx`<span className="t-filter-input-placeholder"><span className="t-filter-input-placeholder-inner">${ placeholder }</span></span>` : null }
        <input value=${ value } onChange=${ onChangeHandler } className="t-filter-input-controller"/>
        <span className="t-filter-input-view"/>
      </label>
    </div>
  `;
})
)}

function _47(render,useState,jsx,Collapsible,FilterInputComponent){return(
render(() => {
  const [val, setVal] = useState(''); 
  return jsx`
    <${ Collapsible } label="Show filter input">
      <${ FilterInputComponent } 
        value=${ val }
        onChange=${ setVal }
        placeholder="Type something in here"
      />
    </${ Collapsible }>
  `;
})
)}

function _CheckboxComponent(component,useMemo,jsx,classnames,NBSP)
{
  const State = {
    'checked': 'checked',
    'unchecked': 'unchecked',
    'mixed': 'mixed',
  };

  const Checkbox = component(({ children, disabled, state, onChange }) => {
    const resolvedState = typeof state === "boolean" 
      ? (state ? State.checked : State.unchecked)
      : state;

    const changeHandler = useMemo(() => {
      if (!onChange) { return undefined; };
      return (e) => onChange(e.target.checked ? State.unchecked : State.checked);
    }, [onChange]);
    
    return jsx`
      <style>
        .t-checkbox-wrap {
          position: relative;
          display: inline-block;
          vertical-align: baseline;
          cursor: pointer;
        }
        .t-checkbox-wrap_disabled {
          cursor: default;
          pointer-events: none;
        }
  
        .t-checkbox-row {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: baseline;
          align-content: baseline;
        }
  
        .t-checkbox-controller {
          position: absolute;
          overflow: hidden;
          clip: rect(0 0 0 0);
          height: 1px; width: 1px;
          margin: -1px; padding: 0; border: 0;
        }
  
        .t-checkbox {
          display: inline-block;
          position: relative;
          user-select: none;
          border: 1px solid black;
          border-radius: 1px;
  
          box-sizing: border-box;
          width: 16px;
          height: 16px;
          flex: 0 0 16px;
          margin-right: 8px;
  
          font-size: 0;
          line-height: 0;
        }
        .t-checkbox:before {
          content: "";
          display: inline-block;
          font-size: 0;
          line-height: 0;
          margin-top: 11px;
        }
        .t-checkbox_disabled {
          border-color: #ccc;
        }
  
        .t-checkbox-controller:focus + .t-checkbox {
          outline: solid 2px #db7c00;
          outline-offset: 1px;
        }
  
        .t-checkbox-checkmark {
          display: none;
        }
        .t-checkbox-checkmark_checked {
          border-bottom: 2px solid black;
          border-right: 2px solid black;
          transform: scale(0.9) rotate(50deg) skewX(12deg);
  
          position: absolute;
          top: 50%;
          left: 50%;
  
          width: 8px;
          height: 24px;
          margin: -21px 0 0 -1.5px;
  
          font-size: 16px;
          line-height: 20px;
        }
        .t-checkbox-checkmark_mixed {
          border-bottom: 2px solid black;
  
          position: absolute;
          top: 50%;
          left: 50%;
  
          width: 8px;
          height: 1px;
          margin: -1px 0 0 -4px;
  
          font-size: 16px;
          line-height: 20px;
        }
        .t-checkbox-checkmark_disabled {
          border-color: #ccc;
        }
        .t-checkbox-controller:checked + .t-checkbox > .t-checkbox-checkmark {
          display: block;
        }
  
        .t-checkbox-label {
          display: inline;
          font-size: 16px;
          line-height: 20px;
          margin-bottom: 2px;
        }
        .t-checkbox-label_disabled {
          color: #ccc;
        }
      </style>
      <label className=${classnames('t-checkbox-wrap', { 't-checkbox-wrap_disabled': disabled })}>
        <div className="t-checkbox-row">
          <input className="t-checkbox-controller" type="checkbox" disabled=${disabled} checked=${resolvedState !== State.unchecked} onChange=${changeHandler}/>
          <span className=${classnames('t-checkbox', { 't-checkbox_disabled': disabled })}>
            <span className=${classnames('t-checkbox-checkmark', { 
              't-checkbox-checkmark_disabled': disabled,
              't-checkbox-checkmark_checked': resolvedState === State.checked,
              't-checkbox-checkmark_mixed': resolvedState === State.mixed,
            })}><${NBSP}/></span>
          </span>
          <div className=${classnames('t-checkbox-label', { 't-checkbox-label_disabled': disabled })}>${ children }</div>
        </div>
      </label>
    `;
  });

  Checkbox.State = State;
  return Checkbox;
}


function _checked(CheckboxComponent,render,useState,useCallback,jsx)
{
  const nextState = (currentState) => {
    switch (currentState) {
      case CheckboxComponent.State.unchecked: return CheckboxComponent.State.checked;
      case CheckboxComponent.State.checked: return CheckboxComponent.State.mixed;
      case CheckboxComponent.State.mixed: return CheckboxComponent.State.unchecked;
      default:
        throw new Error("Unknown current state: " + currentState);
    }
  };
  
  return render(({ useSetter }) => {
    const [checked, setChecked] = useState(CheckboxComponent.State.unchecked);  
    useSetter(checked);
    
    const toggle = useCallback(() => setChecked(nextState(checked)), [checked, setChecked]);
    return jsx`<${CheckboxComponent} state=${checked} onChange=${toggle}>whop</${CheckboxComponent}>`
  })
}


function _SparklineBars(component,jsx,NBSP){return(
component(({ items }) => {
  return jsx`
    <style>
      .t-sparkline-bars {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
      }

      .t-sparkline-bars-chunk {
        height: 20px;
        flex: 0 0 auto;
      }
    </style>
    <div className="t-sparkline-bars">
      ${ items.map(({ color, percentage, type }) => {
        return jsx`<div key=${ type } className="t-sparkline-bars-chunk" style=${ { backgroundColor: color, flexBasis: `${percentage}%` } }>
          <${NBSP} />
        </div>`;
      }) }
    </div>
  `;
})
)}

function _SelectableItemList(reactWindow,component,useCallback,useMemo,jsx,CheckboxComponent,SparklineBars,useState,useEffect,useRef,ResizeObserver,FilterInputComponent)
{
  const Grid = reactWindow.VariableSizeGrid;

  const ItemWrapper = component(({ style, id, name, onToggle, disabled, children }) => {
    const toggle = useCallback(() => {
      if (!onToggle) { return; }
      onToggle(id)
    }, [onToggle, id]);

    const adjustedStyle = useMemo(() => ({ 
      ...style, 
      lineHeight: `${style.height}px`,
      opacity: onToggle && disabled ? .33 : 1,
      cursor: 'pointer',
    }), [style, onToggle, disabled]);
    return jsx`<div style=${adjustedStyle} onClick=${ toggle } title=${ name }>${ children }</div>`;
  });
  
  const ItemCheckbox = component(({ id, isSelected, onToggle }) => {
    const toggle = useCallback(() => onToggle(id), [onToggle, id]);
    return jsx`<${CheckboxComponent} state=${ isSelected } onChange=${ toggle }/>`;
  });

  const ItemName = component(({ name }) => jsx`<span className="t-selectable-list-item-name">${ name }</span>`);
  const ItemMetric = component(({ overallMetric }) => jsx`<div className="t-selectable-list-item-metric">${ overallMetric }</div>`);
  const ItemBreakdown = component(({ metricBreakdown }) => jsx`<${SparklineBars} items=${ metricBreakdown }/>`);
  
  return ({ name, filterPlaceholder, items, isFiltered, onSelectionChange, initialSelection, initialFilterStr }) => {
    const [selected, setSelected] = useState(initialSelection ?? items.map(i => i.id));
    
    const [filterStr, setFilterStr] = useState(initialFilterStr ?? '');
    const filteredItems = useMemo(() => {
      const filter = filterStr.trim().toLowerCase();
      if (!filter) { return items; }

      return items.filter(({ name }) => name.toLowerCase().includes(filter));
    }, [items, filterStr]);

    const visibleSelectedItems = useMemo(() => filteredItems.filter(i => selected.includes(i.id)), [selected, filteredItems]);
    useEffect(() => onSelectionChange(visibleSelectedItems.map(i => i.id)), [visibleSelectedItems]);
  
    const numTotal = items.length;
    const numSelected = selected.length;
    const overallSelectionState = useMemo(() => {
      if (filteredItems.length === visibleSelectedItems.length) { return CheckboxComponent.State.checked; }
      if (visibleSelectedItems.length === 0) { return CheckboxComponent.State.unchecked; }
      return CheckboxComponent.State.mixed;
    }, [filteredItems, visibleSelectedItems]);

    const onToggleOverallSelection = useCallback(() => {
      if (overallSelectionState === CheckboxComponent.State.checked) {
        // Was checked — unselect all
        return setSelected([]);
      }
  
      // Was unchecked or mixed — select all filtered
      setSelected(filteredItems.map(i => i.id));
    }, [overallSelectionState, filteredItems, setSelected]);

    const onItemToggled = useCallback(id => {
      const idx = selected.indexOf(id);
      if (idx === -1) {
        return setSelected([...selected, id]);
      }

      // Remove the item from selected
      setSelected([...selected.slice(0, idx), ...selected.slice(idx + 1)]);
    }, [selected, setSelected]);

    const wrapperRef = useRef(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
      if (!wrapperRef.current) { return; } 

      setWidth(wrapperRef.current.clientWidth);
      const observer = new ResizeObserver((observerEntry) => {
        const { width } = observerEntry[0].contentRect;
        setWidth(Math.round(width));
      });
  
      observer.observe(wrapperRef.current);
      return () => observer.disconnect();
    }, [wrapperRef.current, setWidth]);

    const rowHeight = 20;
    const getRowHeight = useCallback(() => rowHeight, [rowHeight]);

    const checkboxWidth = 24;
    const metricToNameOffset = 8;
    const longestOverallMetricChars = Math.max(...items.map(i => i.overallMetric.length), 0);
    const metricWidth = metricToNameOffset + longestOverallMetricChars * 10;
    const chartsWidth = Math.round(width / 4);
    const columnWidths = useMemo(() => [
      checkboxWidth,
      width - chartsWidth - checkboxWidth - metricWidth,
      metricWidth,
      chartsWidth,
    ], [width, metricWidth, chartsWidth, checkboxWidth]);
    const getColumnWidth = useCallback(index => columnWidths[index], [columnWidths]);

    const overallSelectionCheckboxWidth = useMemo(() => ({ width: `${ columnWidths[0] }px` }), [columnWidths]);
    const listNameWidth = useMemo(() => ({ width: `${ columnWidths[1] }px` }), [columnWidths]);
    const filterWidth = useMemo(() => ({ width: `${ columnWidths[3] + columnWidths[2] }px` }), [columnWidths]);

    const Cell = useMemo(() => {
      const getContent = (colIndex, rowIndex) => {
        const item = filteredItems[rowIndex];
        switch (colIndex) {
          case 0: return jsx`<${ ItemCheckbox } ...${item} isSelected=${ selected.includes(item.id) } onToggle=${onItemToggled}/>`;
          case 1: return jsx`<${ ItemName } ...${item}/>`;
          case 2: return jsx`<${ ItemMetric } ...${item}/>`;
          case 3: return jsx`<${ ItemBreakdown } ...${item}/>`;
          default:
            throw new Error(`Unhandled column index ${ colIndex }`);
        }
      }
      
      return ({ columnIndex, rowIndex, style }) => {
        const item = filteredItems[rowIndex];
        return jsx`<${ ItemWrapper } style=${ style } ...${item} onToggle=${ columnIndex > 0 ? onItemToggled : undefined }>
          ${ getContent(columnIndex, rowIndex) }
        </${ ItemWrapper }>`;
      };
    }, [filteredItems, selected, onItemToggled]);

    const cellHorizontalOffset = '16px';
    const rowVerticalOffset = '0px';
    return jsx`
      <style>
        .t-selectable-list-wrapper {
          width: 100%;
          max-width: 100%;
        }

        .t-selectable-list-header-row {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;

          align-items: center;
          align-content: center;

          min-height: 55px;
          margin-bottom: 8px;
        }

        .t-selectable-list-header-name {
          font-weight: 700;
          cursor: pointer;
          }

        .t-selectable-list-item-name {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          width: inherit;
          display: inline-block;
        }

        .t-selectable-list-item-metric {
          padding: 0 ${ metricToNameOffset / 2 }px;
          text-align: right;
        }
      </style>
      <div ref=${wrapperRef} className="t-selectable-list-wrapper">
        <div className="t-selectable-list-header-row">
          <span style=${ overallSelectionCheckboxWidth }>
            <${CheckboxComponent} state=${ overallSelectionState } onChange=${ onToggleOverallSelection }/>
          </span>
          <span className="t-selectable-list-header-name" style=${ listNameWidth } onClick=${ onToggleOverallSelection }>
            ${ name } (${ visibleSelectedItems.filter(x => !x.disabled).length })
          </span>
          ${ isFiltered ? jsx`<span style=${ filterWidth }><${ FilterInputComponent } 
            value=${ filterStr }
            onChange=${ setFilterStr }
            placeholder=${ filterPlaceholder }
          /></span>` : null }
        </div>
        <${Grid}
          key=${ columnWidths.join('-') }
          columnCount=${4}
          columnWidth=${getColumnWidth}
          rowCount=${filteredItems.length}
          rowHeight=${getRowHeight}
          width=${ width }
          height=${ Math.min(items.length * rowHeight, 200) }
        >${Cell}</${Grid}>
      </div>
    `;
  }
}


function _52(render,useState,jsx,Collapsible,SelectableItemList)
{ 
  const items = [
    { id: 'one', name: 'One', overallMetric: '46%', metricBreakdown: [
      { type: 'homebrew', color: '#ccc', percentage: 30 },
      { type: 'target', color: '#C39999', percentage: 50 },
      { type: 'other', color: '#335AE3', percentage: 20 },
    ], disabled: false },
    { id: 'two', name: 'Two', overallMetric: '33%', metricBreakdown: [
      { type: 'homebrew', color: '#ccc', percentage: 15 },
      { type: 'target', color: '#C39999', percentage: 20 },
      { type: 'other', color: '#335AE3', percentage: 33 },
    ], disabled: true },
  ];
  
  return render(() => {
    const [_, setSelected] = useState(items.map(i => i.id));
    return jsx`<${ Collapsible } label="Show selectable list demo">
      <${ SelectableItemList }
        name="Projects"
        filterPlaceholder="Filter projects..."
        isFiltered
        onSelectionChange=${ setSelected }
        items=${ items }/>
      </${ Collapsible }>`;
  });
}


function _FiltersComponent(component,useState,jsx,SelectableItemList){return(
component(({ useSetter, sources, projects, components }) => {
  const [selectedSources, setSelectedSources] = useState(sources.map(s => s.id));
  const [selectedProjects, setSelectedProjects] = useState(projects.map(s => s.id));
  const [selectedComponents, setSelectedComponents] = useState(components.map(s => s.id));
  useSetter({
    selectedSources, 
    selectedProjects, 
    selectedComponents,
  });

  const columnGap = 48;
  return jsx`
    <style>
      .t-filters-row {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        margin-bottom: -40px;
      }
      .t-filter-item {
        flex: 0 0 calc(33% - ${ 2 * columnGap / 3 }px);
        width: calc(33% - ${ 2 * columnGap / 3 }px);
        min-width: 250px;
        margin-bottom: 40px;
      }

      .t-filter-item:not(:last-child) {
        margin-right: ${columnGap}px;
      }
    </style>
    <div className="t-filters-row">
      <div className="t-filter-item">
        <${ SelectableItemList }
          name="Sources"
          filterPlaceholder=""
          isFiltered=${ false }
          onSelectionChange=${ setSelectedSources }
          items=${ sources }/>
      </div>

      <div className="t-filter-item">
        <${ SelectableItemList }
          name="Projects"
          filterPlaceholder="All"
          isFiltered
          onSelectionChange=${ setSelectedProjects }
          items=${ projects }/>
      </div>

      <div className="t-filter-item">
        <${ SelectableItemList }
          name="Components"
          filterPlaceholder="All"
          isFiltered
          onSelectionChange=${ setSelectedComponents }
          items=${ components }/>
      </div>
    </div>
  `;
})
)}

function _RadioToggler(component,jsx,classnames){return(
component(({ children, disabled, name, value, checked, onChange }) => {
  return jsx`
    <label className=${classnames('t-toggler-wrap', { 't-toggler-wrap_disabled': disabled })} onClick=${ onChange }>
      <input className="t-toggler-controller" type="radio" name=${ name } value=${ value } disabled=${disabled} checked=${checked} onChange=${onChange}/>
      <div className=${classnames('t-toggler-label', { 't-toggler-label_disabled': disabled })}>${ children }</div>
    </label>
    <style className="t-toggler-styles">
      .t-toggler-wrap {
        position: relative;
        display: inline-block;
        vertical-align: baseline;
        cursor: pointer;
      }
      .t-toggler-wrap_disabled {
        cursor: default;
        pointer-events: none;
      }

      .t-toggler-label {
        display: block;
        font-size: 16px;
        line-height: 20px;

        padding: 2px 4px;
        border-bottom: 2px solid transparent;
      }
      .t-toggler-label_disabled {
        color: #ccc;
      }

      /* For multiple radios side-by-side */
      .t-toggler-styles + .t-toggler-wrap > .t-toggler-label {
        border-left: 0;
      }
  
      .t-toggler-controller {
        position: absolute;
        overflow: hidden;
        clip: rect(0 0 0 0);
        height: 1px; width: 1px;
        margin: -1px; padding: 0; border: 0;
      }

      .t-toggler-controller:focus + .t-toggler-label {
        outline: solid 2px #db7c00;
        outline-offset: 1px;
      }
      .t-toggler-controller:checked + .t-toggler-label {
        border-bottom-color: black;
      }
    </style>
  `;
})
)}

function _55(render,jsx,RadioToggler){return(
render(() => jsx`
  <${ RadioToggler } name="radio-test" value=1>One</${ RadioToggler }>
  <${ RadioToggler } name="radio-test" value=2>Another</${ RadioToggler }>
  <${ RadioToggler } name="radio-test" value=3 disabled>Disabled</${ RadioToggler }>
`)
)}

function _MetricSelector(component,useState,jsx,RadioToggler)
{
  const Metrics = {
    share: "share",
    absolute: "absolute",
    components: "components",
    reuse: "reuse",
  }
  
  const Selector = component(({ useSetter, isSingleSource }) => {
    const metrics = {
      [Metrics.share]: {
        label: "Share",
        disabled: isSingleSource,
        ifDisabled: Metrics.absolute,
      },
      [Metrics.absolute]: {
        label: "Absolute",
        disabled: false,
        get ifDisabled() { throw new Error("No ifDisabled set on absolute metric"); }
      },
      [Metrics.components]: {
        label: "Components",
        disabled: false,
        get ifDisabled() { throw new Error("No ifDisabled set on components metric"); }
      },
      [Metrics.reuse]: {
        label: "Reuse",
        disabled: false,
        get ifDisabled() { throw new Error("No ifDisabled set on reuse metric"); }
      },
    };
    
    const [desiredMetric, setDesiredMetric] = useState(Metrics.share);
    const selectedMetric = metrics[desiredMetric].disabled ? metrics[desiredMetric].ifDisabled : desiredMetric;
    useSetter(selectedMetric);
    
    return jsx`${ Object.keys(metrics).map(metric => {
      return jsx`<${ RadioToggler } 
        name="selected-metric" 
        value=${ metric } 
        checked=${ selectedMetric === metric }
        disabled=${ metrics[metric].disabled }
        onChange=${ () => setDesiredMetric(metric) }
      >${ metrics[metric].label }</${ RadioToggler }>`
    }) }`;
  });

  Selector.Metrics = Metrics;
  return Selector;
}


function _57(render,jsx,MetricSelector){return(
render(({ useSetter }) => jsx`<${ MetricSelector } useSetter=${ useSetter } isSingleSource />`)
)}

function _58(md){return(
md`## Database

Establish connection to the database, along with search index.`
)}

function _debugDatabaseTimings(){return(
false
)}

async function _usagesDB(FileAttachment,debugDatabaseTimings)
{
  const getDB = async () => {
    const db = await FileAttachment("usages@1.sqlite").sqlite();
    if (!debugDatabaseTimings) { return db; }

    const wrap = (fn) => async (sql, ...args) => {
      const explain = await fn.call(db, `EXPLAIN QUERY PLAN ${ sql }`, ...args);
      const explainStr = explain.length ? explain.map(x => x.detail).join("\n") : sql;

      const start = Date.now();
      const res = await fn.call(db, sql, ...args);
      console.log(Date.now() - start, explainStr);
      return res;
    }

    return {
      query: wrap(db.query),
      queryRow: wrap(db.queryRow),
    };
  };

  const db = await getDB();

  // Create the search indices to use with the queries below
  await db.query(`CREATE INDEX IF NOT EXISTS usages_historical_data ON usages ("weeksAgo", source, project, component)`);
  await db.query(`CREATE INDEX IF NOT EXISTS components_per_week ON usages (component, "weeksAgo")`);
  await db.query(`CREATE INDEX IF NOT EXISTS sources_per_week ON usages (source, "weeksAgo")`);
  
  return db;
}


function _61(md){return(
md`## Data about all avilable sources, projects and components`
)}

async function _allSources(usagesDB){return(
(await usagesDB.query(`
  WITH used_sources AS (SELECT DISTINCT source FROM usages)
  SELECT id, sources.source, usages.source is not null as isUsed
    FROM sources
    LEFT JOIN (SELECT * FROM used_sources) usages ON (usages.source = sources.id)
`)).map(s => ({ id: s.id, name: s.source, isUsed: Boolean(s.isUsed) }))
)}

async function _allProjects(usagesDB){return(
(await usagesDB.query(`SELECT id, project FROM projects`))
  .map(({ id, project }) => ({ id, name: project.replace(/_git$/, '').replace(/_/g, ' ')}))
)}

async function _allComponents(usagesDB){return(
(await usagesDB.query(`SELECT id, component FROM components`))
  .map(({ id, component }) => ({ id, name: component }))
)}

function _65(md){return(
md`## Debounce filters

Changing filters triggers heavy updates, so changes are debounced to avoid at least some freezes.

\`selectedFilters\` are defined as the output of the dashboard filters cell.`
)}

function _debounceInterval(){return(
500
)}

function _filtersDebouncer(_,$0,debounceInterval){return(
_.debounce((serializedFilters, current) => {
  if (current === serializedFilters) { return; }
  $0.value = serializedFilters; 
}, debounceInterval, { leading: false, trailing: true })
)}

function _debouncedSerializedSelectedFilters(){return(
JSON.stringify({selectedSources: [], selectedProjects: [], selectedComponents: []})
)}

function _debouncedSelectedFilters(debouncedSerializedSelectedFilters){return(
JSON.parse(debouncedSerializedSelectedFilters)
)}

function _70(d3,filtersDebouncer,selectedFilters,debouncedSerializedSelectedFilters)
{
  const sortSelectedIds = filters => Object.keys(filters).reduce((_f, k) => {
    _f[k] = [...filters[k]].sort(d3.ascending);
    return _f;
  }, {});
  
  filtersDebouncer(JSON.stringify(sortSelectedIds(selectedFilters)), debouncedSerializedSelectedFilters)
  return "Invoke filtersDebouncer when selectedFilters change";
}


function _filterConditions(debouncedSelectedFilters,allSources,allProjects,allComponents)
{
  const condition = (field, selected, all) => {
    if (selected.length === all.length) { return 'TRUE'; }
    if (selected.length === 0) { return 'FALSE'; }
    if (selected.length === 1) { return `${ field } = ${ selected[0] }` }

    if (selected.length > all.length / 2) {
      const unselected = all.filter(x => !selected.includes(x));
      return `${ field } NOT IN (${ unselected.join(", ") })`;
    }

    return `${ field } IN (${ selected.join(", ") })`;
  };

  return {
    source: condition('usages.source', debouncedSelectedFilters.selectedSources, allSources.map(x => x.id)),
    project: condition('usages.project', debouncedSelectedFilters.selectedProjects, allProjects.map(x => x.id)),
    component: condition('usages.component', debouncedSelectedFilters.selectedComponents, allComponents.map(x => x.id)),
  };
}


function _72(md){return(
md`## Filter data enriched with stats & enable conditions`
)}

function _minPercentageTarget(){return(
10
)}

async function _breakdownBySource(filterConditions,usagesDB,d3,minPercentageTarget,colorScales)
{
  const conditions = `${ filterConditions.project } AND ${ filterConditions.component }`;
  const res = await usagesDB.query(`
    SELECT source,
           COUNT(*) as usages
      FROM usages 
      WHERE weeksAgo = 0 AND ${ conditions }
      GROUP BY usages.source
  `);

  const maxUsages = Math.max(...d3.rollup(res, values => values.reduce((tot, x) => tot + x.usages, 0), x => x.source).values())
  return d3.rollup(res, values => {
    const overallMetricValue = values.reduce((tot, x) => tot + x.usages, 0);

    // Percentages are adjusted so that no item in the breakdown is too small to see.
    const percentages = values.map(val => Math.max(100 * val.usages / maxUsages, minPercentageTarget));
    const totalPercentages = percentages.reduce((tot, x) => tot + x, 0);
    const adjustedPercentages = percentages.map(x => totalPercentages > 100 ? x * 100 / totalPercentages : x);
    
    return ({
      breakdown: values
        .map((val, i) => ({ 
          type: val.source, 
          percentage: adjustedPercentages[i], 
          color: colorScales.standalone(val.source) 
        }))
        .sort((a, b) => {
          if (a.type === "homebrew") { return 1; }
          if (b.type === "homebrew") { return -1; }
          return d3.descending(a.percentage, b.percentage)
        }),
      overallMetric: overallMetricValue.toFixed(0),
      overallMetricValue,
    });
  }, x => x.source);
}


function _sourcesData(allSources,breakdownBySource,d3){return(
allSources
  .map(s => {
    const data = breakdownBySource.get(s.id);
    const overallMetricValue = data?.overallMetricValue ?? 0;
    return ({ 
      ...s, 
      overallMetric: data?.overallMetric ?? "", 
      overallMetricValue, 
      metricBreakdown: data?.breakdown ?? [], 
      disabled: overallMetricValue === 0,
    });
  })
  .sort((a, b) => d3.descending(a.overallMetricValue, b.overallMetricValue))
)}

async function _breakdownByProject(filterConditions,usagesDB,d3,minPercentageTarget,colorScales)
{
  const conditions = `${ filterConditions.source } AND ${ filterConditions.component }` 
  const res = await usagesDB.query(`
    SELECT project,
           source,
           COUNT(*) as usages
      FROM usages 
      WHERE weeksAgo = 0 AND ${ conditions }
      GROUP BY project, source
  `);

  const maxUsages = Math.max(...d3.rollup(res, values => values.reduce((tot, x) => tot + x.usages, 0), x => x.project).values());
  return d3.rollup(res, values => {
    const overallMetricValue = values.reduce((tot, x) => tot + x.usages, 0);

    // Percentages are adjusted so that no item in the breakdown is too small to see.
    const percentages = values.map(val => Math.max(100 * val.usages / maxUsages, minPercentageTarget));
    const totalPercentages = percentages.reduce((tot, x) => tot + x, 0);
    const adjustedPercentages = percentages.map(x => totalPercentages > 100 ? x * 100 / totalPercentages : x);
    
    return ({
      breakdown: values
        .map((val, i) => ({ type: val.source, percentage: adjustedPercentages[i], color: colorScales.standalone(val.source) }))
        .sort((a, b) => {
          if (a.type === "homebrew") { return 1; }
          if (b.type === "homebrew") { return -1; }
          return d3.descending(a.percentage, b.percentage)
        }),
      overallMetric: overallMetricValue.toFixed(0),
      overallMetricValue,
    });
  }, x => x.project);
}


function _projectData(allProjects,breakdownByProject,d3){return(
allProjects
  .map(s => {
    const data = breakdownByProject.get(s.id);
    const overallMetricValue = data?.overallMetricValue ?? 0;
    return ({ 
      ...s, 
      overallMetric: data?.overallMetric ?? "", 
      overallMetricValue, 
      metricBreakdown: data?.breakdown ?? [], 
      disabled: overallMetricValue === 0, 
    });
  })
  .sort((a, b) => d3.descending(a.overallMetricValue, b.overallMetricValue))
)}

function _componentData(allComponents,breakdownByComponent,d3){return(
allComponents
  .map(s => {
    const data = breakdownByComponent.get(s.id);
    const overallMetricValue = data?.overallMetricValue ?? 0;
    return ({ 
      ...s, 
      overallMetric: data?.overallMetric ?? "", 
      overallMetricValue, 
      metricBreakdown: data?.breakdown ?? [], 
      disabled: overallMetricValue === 0, 
    });
  })
  .sort((a, b) => d3.descending(a.overallMetricValue, b.overallMetricValue))
)}

async function _breakdownByComponent(filterConditions,usagesDB,d3,minPercentageTarget,colorScales)
{
  const conditions = `${ filterConditions.source } AND ${ filterConditions.project }` 
  const res = await usagesDB.query(`
    SELECT component,
           source,
           COUNT(*) as usages
      FROM usages 
      WHERE weeksAgo = 0 AND ${ conditions }
      GROUP BY component, source
  `);

  const maxUsages = Math.max(...d3.rollup(res, values => values.reduce((tot, x) => tot + x.usages, 0), x => x.component).values());
  return d3.rollup(res, values => {
    const overallMetricValue = values.reduce((tot, x) => tot + x.usages, 0);

    // Percentages are adjusted so that no item in the breakdown is too small to see.
    const percentages = values.map(val => Math.max(100 * val.usages / maxUsages, minPercentageTarget));
    const totalPercentages = percentages.reduce((tot, x) => tot + x, 0);
    const adjustedPercentages = percentages.map(x => totalPercentages > 100 ? x * 100 / totalPercentages : x);
    
    return ({
      breakdown: values
        .map((val, i) => ({ type: val.source, percentage: adjustedPercentages[i], color: colorScales.standalone(val.source) }))
        .sort((a, b) => {
          if (a.type === "homebrew") { return 1; }
          if (b.type === "homebrew") { return -1; }
          return d3.descending(a.percentage, b.percentage)
        }),
      overallMetric: overallMetricValue.toFixed(0),
      overallMetricValue,
    });
  }, x => x.component);
}


function _80(md){return(
md`## Color scheme`
)}

function _homebrewColor(){return(
"#C2C2C2"
)}

function _homebrewSourceId(usagesDB){return(
usagesDB.queryRow(`SELECT id FROM sources WHERE source = "homebrew"`)
)}

function _colorScales(allSources,d3,homebrewSourceId)
{
  const targetColor = "#D44527";

  const homebrewColor = "#C2C2C2";
  const chartHomebrewColor = homebrewColor + "77";

  const usedSources = allSources.filter(s => s.isUsed);
  const restOfSchema = usedSources.length < 3 ?  [targetColor] : d3.schemeTableau10;
  
  const chart = d3.scaleOrdinal([chartHomebrewColor, ...restOfSchema]);
  const standalone = d3.scaleOrdinal([homebrewColor, ...restOfSchema]);

  if (!homebrewSourceId?.id) {
    throw new Error('Did not find homebrew source id');
  }

  const preset = (source) => {
    chart(source); 
    standalone(source); 
  };

  // Pre-set the homebrew color on the scales
  preset(homebrewSourceId.id);

  // Pre-set all used sources on the scale
  usedSources.forEach(s => preset(s.id));

  return { chart, standalone, homebrewColor };
}


function _84(md){return(
md`## Data queries`
)}

async function _collectedAt(usagesDB){return(
new Date((await usagesDB.queryRow(`SELECT value FROM meta WHERE key = 'collectedAt'`)).value)
)}

async function _schemaVersion(usagesDB){return(
(await usagesDB.queryRow(`SELECT value FROM meta WHERE key = 'schemaVersion'`)).value
)}

async function _isSingleSource(usagesDB,filterConditions)
{
  const res = await usagesDB.query(`
    SELECT DISTINCT source
      FROM usages 
      WHERE ${ filterConditions.source } AND ${ filterConditions.project } AND ${ filterConditions.component }
      LIMIT 2
  `);

  return res.length < 2;
}


async function _isSingleSnapshot(usagesDB,filterConditions)
{
  const res = await usagesDB.query(`
    SELECT DISTINCT weeksAgo
      FROM usages 
      WHERE ${ filterConditions.source } AND ${ filterConditions.project } AND ${ filterConditions.component }
      LIMIT 2
  `);

  return res.length < 2;
}


function _filteredUsageCountBySource(MetricSelector,selectedMetric,usagesDB,filterConditions){return(
[MetricSelector.Metrics.share, MetricSelector.Metrics.absolute].includes(selectedMetric) ? usagesDB.query(`SELECT weeksAgo, source, COUNT(*) as usages
  FROM usages 
  WHERE ${ filterConditions.source } AND ${ filterConditions.project } AND ${ filterConditions.component }
  GROUP BY weeksAgo, source 
`) : []
)}

function _maxComponentsForPerComponentUsage(){return(
50
)}

async function _filteredUsageCountByComponent(selectedMetric,MetricSelector,usagesDB,filterConditions,maxComponentsForPerComponentUsage)
{
  if (selectedMetric !== MetricSelector.Metrics.components) { return { exact_components: true, usages: [] }; }
  
  const matchingComponents = await usagesDB.query(`
    SELECT DISTINCT component
      FROM usages
      WHERE ${ filterConditions.source } AND ${ filterConditions.project } AND ${ filterConditions.component }
  `);

  const useExactComponents = matchingComponents.length <= maxComponentsForPerComponentUsage;

  return {
    exact_components: useExactComponents,
    usages: await usagesDB.query(`
      WITH prominent_components AS (
        SELECT DISTINCT component
          FROM usages
          WHERE component in (${ matchingComponents.map(x => x.component) })
            AND weeksAgo = 0
          GROUP BY component
          ORDER BY COUNT(*) DESC LIMIT ${ maxComponentsForPerComponentUsage }
      )
      SELECT weeksAgo, component, source, COUNT(*) as usages
        FROM usages 
        WHERE component in (${ useExactComponents ? matchingComponents.map(x => x.component) : `SELECT component FROM prominent_components` })
          AND ${ filterConditions.source } AND ${ filterConditions.project } AND ${ filterConditions.component }
        GROUP BY weeksAgo, component 
        ORDER BY component, weeksAgo ASC
    `)
  }
}


function _latest_usages_by_file(debouncedSelectedFilters,usagesDB,filterConditions){return(
debouncedSelectedFilters.selectedProjects.length === 1 ? usagesDB.query(`
  SELECT file, COUNT(*) as usages
    FROM usages
    JOIN projects ON (projects.id = usages.project)
    JOIN files ON (files.id = usages.usageFile)
    WHERE weeksAgo = 0
      AND ${ filterConditions.source }
      AND ${ filterConditions.project }
      AND ${ filterConditions.component }
    GROUP BY file, source
`) : []
)}

function _filteredReuseBySource(selectedMetric,MetricSelector,usagesDB,filterConditions){return(
selectedMetric === MetricSelector.Metrics.reuse ? usagesDB.query(`
  SELECT weeksAgo, source, ((usages * 1.0) / (components * 1.0)) as reuse
  FROM (
    SELECT weeksAgo, source, COUNT(*) as usages, COUNT(DISTINCT component) as components
    FROM usages 
    WHERE ${ filterConditions.source } AND ${ filterConditions.project } AND ${ filterConditions.component }
    GROUP BY weeksAgo, source 
  )
`) : []
)}

function _94(md){return(
md`## Charting helpers`
)}

function _positionSegments(d3)
{
  const sum = (arr, k) => arr.map(x => x[k]).reduce((tot, x) => tot + x, 0);
  const merge = (s1, s2) => {
    const flat1 = s1.contains?.length ? s1.contains : [s1];
    const flat2 = s2.contains?.length ? s2.contains : [s2];
    const all = [...flat1, ...flat2];

    return {
      center: sum(all, "center") / all.length,
      width: sum(all, "width"),
      contains: all,
    };
  };

  function mergeAll(segments) {
    if (segments.length === 0) { return []; }
    if (segments.length === 1) { return [...segments]; }

    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      const prev = segments[i - 1];
      if ((prev.center + prev.width / 2) > (segment.center - segment.width / 2)) {
        return mergeAll([
          ...segments.slice(0, i - 1),
          merge(prev, segment),
          ...segments.slice(i + 1),
        ]);
      }
    }

    // Nothing merged — return as is
    return segments;
  }

  return (segments) => {
    const sortedSegments = segments.sort((a, b) => d3.ascending(a.center, b.center));
    const merged = mergeAll(sortedSegments);
    return merged.flatMap((segment, i) => {
      const items = segment.contains;
      if (!items) {
        return [{
          ref: segment, 
          group: i,
          start: segment.center - segment.width / 2,
          end: segment.center + segment.width / 2,
        }];
      }

      let pos = segment.center - segment.width / 2;
      const adjusted = [];
      for (const item of items) {
        const end = pos + item.width;
        adjusted.push({
          ref: item,
          group: i,
          start: pos,
          end,
        });
        pos = end;
      }
      return adjusted;
    });
  };
}


function _96(md){return(
md`## Metadata styling

Sneaky rules visually hiding the first cell, that contains the report title & metadata.`
)}

function _97(htl){return(
htl.html`<style>
  /* For observablehq.com */
  .observablehq-root > .observablehq.observablehq--worker:first-child > *,

  /* For exported report */
  script + .observablehq {
    position: absolute;
    overflow: hidden;
    clip: rect(0 0 0 0);
    height: 1px; width: 1px;
    margin: -1px; padding: 0; border: 0;
  }
</style>`
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["usages@1.sqlite", {url: new URL("./files/usages.sqlite", import.meta.url), mimeType: "application/x-sqlite3", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer()).define(["schemaVersion","expectedSchemaVersion","md","htl"], _3);
  main.variable(observer()).define(["collectedAt","htl","md"], _4);
  main.variable(observer("viewof selectedMetric")).define("viewof selectedMetric", ["render","jsx","MetricSelector","isSingleSource"], _selectedMetric);
  main.variable(observer("selectedMetric")).define("selectedMetric", ["Generators", "viewof selectedMetric"], (G, _) => G.input(_));
  main.variable(observer()).define(["width","collectedAt","selectedMetric","MetricSelector","filteredUsageCountBySource","d3","Plot","homebrewSourceId","colorScales","isSingleSnapshot","allSources","isSingleSource","filteredReuseBySource","positionSegments","filteredUsageCountByComponent","allComponents","maxComponentsForPerComponentUsage"], _6);
  main.variable(observer("viewof selectedFilters")).define("viewof selectedFilters", ["render","jsx","FiltersComponent","sourcesData","projectData","componentData"], _selectedFilters);
  main.variable(observer("selectedFilters")).define("selectedFilters", ["Generators", "viewof selectedFilters"], (G, _) => G.input(_));
  main.variable(observer()).define(["htl"], _8);
  main.variable(observer()).define(["debouncedSelectedFilters","md","allProjects","latest_usages_by_file","d3","width","htl"], _9);
  main.variable(observer()).define(["htl"], _10);
  main.variable(observer()).define(["md"], _11);
  main.variable(observer()).define(["Generators","html","DOM","MutationObserver"], _12);
  main.variable(observer()).define(["md"], _13);
  main.variable(observer()).define(["md"], _14);
  main.variable(observer()).define(["render","useState","jsx","SelectableItemList"], _15);
  main.variable(observer()).define(["md"], _16);
  main.variable(observer()).define(["render","useState","jsx","SelectableItemList"], _17);
  main.variable(observer()).define(["md"], _18);
  main.variable(observer()).define(["render","useState","jsx","SelectableItemList"], _19);
  main.variable(observer()).define(["md"], _20);
  main.variable(observer()).define(["colorScales","homebrewSourceId","render","useState","jsx","SelectableItemList"], _21);
  main.variable(observer()).define(["md"], _22);
  main.variable(observer()).define(["colorScales","homebrewSourceId","render","useState","jsx","SelectableItemList"], _23);
  main.variable(observer()).define(["md"], _24);
  main.variable(observer()).define(["colorScales","homebrewSourceId","render","useState","jsx","SelectableItemList"], _25);
  main.variable(observer()).define(["htl"], _26);
  main.variable(observer()).define(["md"], _27);
  main.variable(observer("expectedSchemaVersion")).define("expectedSchemaVersion", _expectedSchemaVersion);
  main.variable(observer()).define(["md"], _29);
  main.variable(observer("knownExternalResources")).define("knownExternalResources", _knownExternalResources);
  const child1 = runtime.module(define1);
  main.import("d3Require", child1);
  main.variable(observer("isUrl")).define("isUrl", _isUrl);
  main.variable(observer()).define(["md"], _34);
  main.variable(observer("reactDevMode")).define("reactDevMode", _reactDevMode);
  main.variable(observer("reactVersion")).define("reactVersion", _reactVersion);
  const child2 = runtime.module(define2).derive(["require",{name: "reactDevMode", alias: "dev"},{name: "reactVersion", alias: "versionRange"}], main);
  main.import("jsx", child2);
  main.import("component", child2);
  main.import("Fragment", child2);
  main.import("render", child2);
  main.import("useState", child2);
  main.import("useCallback", child2);
  main.import("useMemo", child2);
  main.import("useRef", child2);
  main.import("useEffect", child2);
  main.import("React", child2);
  main.variable(observer("reactWindow")).define("reactWindow", ["require","React"], _reactWindow);
  main.variable(observer("classnames")).define("classnames", ["require"], _classnames);
  main.variable(observer("Collapsible")).define("Collapsible", ["component","useState","useCallback","jsx"], _Collapsible);
  main.variable(observer("NBSP")).define("NBSP", ["component","jsx"], _NBSP);
  main.variable(observer("SearchIcon")).define("SearchIcon", ["component","jsx"], _SearchIcon);
  main.variable(observer()).define(["render","jsx","SearchIcon"], _43);
  main.variable(observer("ClearIcon")).define("ClearIcon", ["component","jsx"], _ClearIcon);
  main.variable(observer()).define(["render","jsx","ClearIcon"], _45);
  main.variable(observer("FilterInputComponent")).define("FilterInputComponent", ["component","useCallback","jsx","ClearIcon","SearchIcon"], _FilterInputComponent);
  main.variable(observer()).define(["render","useState","jsx","Collapsible","FilterInputComponent"], _47);
  main.variable(observer("CheckboxComponent")).define("CheckboxComponent", ["component","useMemo","jsx","classnames","NBSP"], _CheckboxComponent);
  main.variable(observer("viewof checked")).define("viewof checked", ["CheckboxComponent","render","useState","useCallback","jsx"], _checked);
  main.variable(observer("checked")).define("checked", ["Generators", "viewof checked"], (G, _) => G.input(_));
  main.variable(observer("SparklineBars")).define("SparklineBars", ["component","jsx","NBSP"], _SparklineBars);
  main.variable(observer("SelectableItemList")).define("SelectableItemList", ["reactWindow","component","useCallback","useMemo","jsx","CheckboxComponent","SparklineBars","useState","useEffect","useRef","ResizeObserver","FilterInputComponent"], _SelectableItemList);
  main.variable(observer()).define(["render","useState","jsx","Collapsible","SelectableItemList"], _52);
  main.variable(observer("FiltersComponent")).define("FiltersComponent", ["component","useState","jsx","SelectableItemList"], _FiltersComponent);
  main.variable(observer("RadioToggler")).define("RadioToggler", ["component","jsx","classnames"], _RadioToggler);
  main.variable(observer()).define(["render","jsx","RadioToggler"], _55);
  main.variable(observer("MetricSelector")).define("MetricSelector", ["component","useState","jsx","RadioToggler"], _MetricSelector);
  main.variable(observer()).define(["render","jsx","MetricSelector"], _57);
  main.variable(observer()).define(["md"], _58);
  main.variable(observer("debugDatabaseTimings")).define("debugDatabaseTimings", _debugDatabaseTimings);
  main.variable(observer("usagesDB")).define("usagesDB", ["FileAttachment","debugDatabaseTimings"], _usagesDB);
  main.variable(observer()).define(["md"], _61);
  main.variable(observer("allSources")).define("allSources", ["usagesDB"], _allSources);
  main.variable(observer("allProjects")).define("allProjects", ["usagesDB"], _allProjects);
  main.variable(observer("allComponents")).define("allComponents", ["usagesDB"], _allComponents);
  main.variable(observer()).define(["md"], _65);
  main.variable(observer("debounceInterval")).define("debounceInterval", _debounceInterval);
  main.variable(observer("filtersDebouncer")).define("filtersDebouncer", ["_","mutable debouncedSerializedSelectedFilters","debounceInterval"], _filtersDebouncer);
  main.define("initial debouncedSerializedSelectedFilters", _debouncedSerializedSelectedFilters);
  main.variable(observer("mutable debouncedSerializedSelectedFilters")).define("mutable debouncedSerializedSelectedFilters", ["Mutable", "initial debouncedSerializedSelectedFilters"], (M, _) => new M(_));
  main.variable(observer("debouncedSerializedSelectedFilters")).define("debouncedSerializedSelectedFilters", ["mutable debouncedSerializedSelectedFilters"], _ => _.generator);
  main.variable(observer("debouncedSelectedFilters")).define("debouncedSelectedFilters", ["debouncedSerializedSelectedFilters"], _debouncedSelectedFilters);
  main.variable(observer()).define(["d3","filtersDebouncer","selectedFilters","debouncedSerializedSelectedFilters"], _70);
  main.variable(observer("filterConditions")).define("filterConditions", ["debouncedSelectedFilters","allSources","allProjects","allComponents"], _filterConditions);
  main.variable(observer()).define(["md"], _72);
  main.variable(observer("minPercentageTarget")).define("minPercentageTarget", _minPercentageTarget);
  main.variable(observer("breakdownBySource")).define("breakdownBySource", ["filterConditions","usagesDB","d3","minPercentageTarget","colorScales"], _breakdownBySource);
  main.variable(observer("sourcesData")).define("sourcesData", ["allSources","breakdownBySource","d3"], _sourcesData);
  main.variable(observer("breakdownByProject")).define("breakdownByProject", ["filterConditions","usagesDB","d3","minPercentageTarget","colorScales"], _breakdownByProject);
  main.variable(observer("projectData")).define("projectData", ["allProjects","breakdownByProject","d3"], _projectData);
  main.variable(observer("componentData")).define("componentData", ["allComponents","breakdownByComponent","d3"], _componentData);
  main.variable(observer("breakdownByComponent")).define("breakdownByComponent", ["filterConditions","usagesDB","d3","minPercentageTarget","colorScales"], _breakdownByComponent);
  main.variable(observer()).define(["md"], _80);
  main.variable(observer("homebrewColor")).define("homebrewColor", _homebrewColor);
  main.variable(observer("homebrewSourceId")).define("homebrewSourceId", ["usagesDB"], _homebrewSourceId);
  main.variable(observer("colorScales")).define("colorScales", ["allSources","d3","homebrewSourceId"], _colorScales);
  main.variable(observer()).define(["md"], _84);
  main.variable(observer("collectedAt")).define("collectedAt", ["usagesDB"], _collectedAt);
  main.variable(observer("schemaVersion")).define("schemaVersion", ["usagesDB"], _schemaVersion);
  main.variable(observer("isSingleSource")).define("isSingleSource", ["usagesDB","filterConditions"], _isSingleSource);
  main.variable(observer("isSingleSnapshot")).define("isSingleSnapshot", ["usagesDB","filterConditions"], _isSingleSnapshot);
  main.variable(observer("filteredUsageCountBySource")).define("filteredUsageCountBySource", ["MetricSelector","selectedMetric","usagesDB","filterConditions"], _filteredUsageCountBySource);
  main.variable(observer("maxComponentsForPerComponentUsage")).define("maxComponentsForPerComponentUsage", _maxComponentsForPerComponentUsage);
  main.variable(observer("filteredUsageCountByComponent")).define("filteredUsageCountByComponent", ["selectedMetric","MetricSelector","usagesDB","filterConditions","maxComponentsForPerComponentUsage"], _filteredUsageCountByComponent);
  main.variable(observer("latest_usages_by_file")).define("latest_usages_by_file", ["debouncedSelectedFilters","usagesDB","filterConditions"], _latest_usages_by_file);
  main.variable(observer("filteredReuseBySource")).define("filteredReuseBySource", ["selectedMetric","MetricSelector","usagesDB","filterConditions"], _filteredReuseBySource);
  main.variable(observer()).define(["md"], _94);
  main.variable(observer("positionSegments")).define("positionSegments", ["d3"], _positionSegments);
  main.variable(observer()).define(["md"], _96);
  main.variable(observer()).define(["htl"], _97);
  return main;
}
