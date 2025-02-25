![image](https://github.com/user-attachments/assets/a58ceaf8-0eab-4f1a-9073-912fd840f08d)

[![Next.js](https://img.shields.io/badge/nextjs-14.2.4-blue?logo=next.js&logoColor=white)](https://github.com/topics/nextjs)  [![React](https://img.shields.io/badge/react-18.3.1-blue?logo=react&logoColor=white)](https://github.com/topics/react)  [![Material UI](https://img.shields.io/badge/material--ui-5.16.14-blue?logo=material-ui&logoColor=white)](https://github.com/topics/material-ui)  [![TailwindCSS](https://img.shields.io/badge/tailwindcss-3.4.4-blue?logo=tailwindcss&logoColor=white)](https://github.com/topics/tailwind-css)  [![Three.js](https://img.shields.io/badge/three.js-0.165.0-blue?logo=three.js&logoColor=white)](https://github.com/topics/threejs)  [![Satellite.js](https://img.shields.io/badge/satellite.js-5.0.0-blue)](https://github.com/topics/satellite)  [![Typesense](https://img.shields.io/badge/typesense-1.8.2-blue)](https://github.com/topics/typesense)  [![Axios](https://img.shields.io/badge/axios-1.7.2-blue?logo=axios&logoColor=white)](https://github.com/topics/axios)  [![Framer Motion](https://img.shields.io/badge/framer--motion-11.2.11-blue?logo=framer&logoColor=white)](https://github.com/topics/framer-motion)  
[![TypeScript](https://img.shields.io/badge/typescript-5.0-blue?logo=typescript&logoColor=white)](https://github.com/topics/typescript)  [![Docker](https://img.shields.io/badge/docker-blue?logo=docker&logoColor=white)](https://github.com/topics/docker)

**nanoSatView** is an application for visualizing satellite data in 3D. It leverages modern web technologies to provide an interactive interface for tracking satellite orbits, displaying TLE data, and searching satellite information. Built with Next.js and React, nanoSatView combines 3D rendering with real-time data for an immersive user experience.

---

#### v0.1 Changelog

Features added:
- Orbit visualizer in ECEF frame. 
- Real time position of satellite on the globe.
- Real-time attitude metrics such as:
  1. Velocity across each axis in ECEF
  2. Elevation
  3. Geodedic Coords
- A huge database of the latest list of nanosats sent to space.


#### Usage

1. Click the search icon in the top left corner. 
![image](https://github.com/user-attachments/assets/5b2fcb00-c71b-4114-9faf-f06c94c0be50)
2. Search for your desired nanosat.
![image](https://github.com/user-attachments/assets/ee6bd3b2-94f4-4793-bb05-255f92abbaab)
3. Enjoy the visualisation!
![image](https://github.com/user-attachments/assets/2f362e8c-8f11-4b2f-b8a5-903129e5b5a8)

### Contributions & Collaboration
Improvements to nanoSatView are always welcome. Please contact @m0Zahed to get started.

Code contributions are not the only way to help out. Documentation is in the works but feel free to reach out if you want to fit the program to your requirements.

**Additional information**
- 'components/Engine.tsx' contains most of the core functionalities (Globe renderer, frame managing, orbit plotting).
- Backend is currently only composed of a typesense server which serves satellite details. 
- Server is hosted with AWS.


### License
Affero GPLv3 http://www.gnu.org/licenses/agpl-3.0.html
