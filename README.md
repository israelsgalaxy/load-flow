# load-flow
### Bringing load flow algorithms to the web
This project allows amateur users draw electrical power networks and performing power flow analysis on them from any browser.
## User Interface
![Screenshot (343)](https://github.com/israelsgalaxy/load-flow/assets/59661679/ec77183a-9921-4f24-9587-6a7da3b794c7)
### Component Panel
![image](https://github.com/israelsgalaxy/load-flow/assets/59661679/bcfe2b0c-fe43-4b42-8fac-a2f956f5d0c3)
### Graphical Network Editor
![image](https://github.com/israelsgalaxy/load-flow/assets/59661679/6a072ebf-adf2-4253-88cd-c8b87119726c)
### Properties Panel
![image](https://github.com/israelsgalaxy/load-flow/assets/59661679/048fa3aa-5067-48b6-833d-3483db6584d2)
## How to Use
- Add a bus to the graphical network editor by clicking any of the buses in the component panel
- Transmission lines can be drawn between two buses by selecting an active bus (double click), selecting a passive bus (ctrl + double click) and pressing key 'l'
- Update the selected component's parameters from the properties panel. A component can be selected by double-clicking the component in the graphical network editor
- Move buses around by dragging them in the graphical network editor
- Components can be deleted by pressing the delete key in the graphical network editor
- Select power flow algorithm and set iteration limit from properties panel
- Click 'Calculate Power Flow' button to download power flow analysis result from server
## Try it out
https://power-flow.onrender.com/ (could take up to 2mins to load webpage as it is hosted using a free-tier)
