const targets = {
    grafana: /^@grafana\/ui(?!.*\.s?css$)/,
    ant: /^(antd|@ant-design)/,
    mui: /^(@mui|@material-ui)/,
    chakra: /^chakra-ui/,
    headlessui: /^@headlessui/,
    bootstrap: /^react-bootstrap/,
    visx: /^@visx/,
    spectrum: /^@adobe\/react-spectrum/,
    "iot-app-kit": /^@iot-app-kit/,
    nivo: /^@nivo/,
    primereact: /^primereact/,
    rc: /^rc-/, // https://react-component.github.io/
    reactstrap: /^reactstrap/,
};

module.exports = [
  {
    repoUrl: "https://github.com/percona/grafana-dashboards.git",
    subprojectPath: "/pmm-app",
    isTargetModuleOrPath: targets,
    maxWeeks: 20,
  },
]
