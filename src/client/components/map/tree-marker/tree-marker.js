import React from "react";
import {Marker} from "react-leaflet";
import L from "leaflet"; // Necessary to use custom icons because not included in react-leaflet
import MarkerPopup from "../marker-popup/marker-popup";
import axios from "axios";

const TreeMarker = ({trees, wrapperSetTrees}) => {
    const handleClickMarker = treeId => {
        const currentUser = localStorage.getItem("currentUser")
            ? JSON.parse(localStorage.getItem("currentUser"))
            : null;

        axios
            .get(`/api/tree/${treeId}`, {
                headers: {Authorization: `Bearer ${currentUser.token}`},
            })
            .then(response => {
                const treeUpdated = response.data;

                // eslint-disable-next-line no-confusing-arrow
                const treesUpdated = trees.map(tree =>
                    tree._id === treeUpdated._id ? {...treeUpdated} : tree,
                );

                wrapperSetTrees(treesUpdated);
            })
            // eslint-disable-next-line no-unused-vars
            .catch(error => {
                // console.log(error);
            });
    };

    let treeMarkers = [];
    // eslint-disable-next-line no-undefined
    if (trees !== undefined) {
        treeMarkers = trees.map(tree => {
            const markerColor = tree.owner[0] ? tree.owner[0].color : "#000000";

            const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1000' height='1000'><path d='M2,111 h300 l-242.7,176.3 92.7,-285.3 92.7,285.3 z' fill='${markerColor}'/></svg>`;
            const iconUrl = encodeURI(`data:image/svg+xml,${svg}`).replace(
                "#",
                "%23",
            );

            const icon = L.icon({
                iconUrl,
                // shadowUrl: 'leaf-shadow.png',
                iconSize: [80, 80], // size of the icon
                // shadowSize:   [50, 64], // size of the shadow
                iconAnchor: [40, 40], // point of the icon which will correspond to marker's location
                // shadowAnchor: [4, 62],  // the same for the shadow
                popupAnchor: [-35, -40], // point from which the popup should open relative to the iconAnchor
            });

            return (
                <Marker
                    icon={icon}
                    position={[
                        tree.location.coordinates[0],
                        tree.location.coordinates[1],
                    ]}
                    key={tree._id}
                    onClick={() => {
                        handleClickMarker(tree._id);
                    }}>
                    <MarkerPopup tree={tree} />
                </Marker>
            );
        });
    }

    return treeMarkers;
};
export default TreeMarker;
