exports.getTreeValue = function (tree) {
    return Math.ceil(tree.diameter * tree.height);
};

const mongoose = require("mongoose");
const Tree = require("../models/tree");

const queryGeolocTrees100MeterRadius = tree => ({
    $geoNear: {
        near: {
            type: "Point",
            coordinates: tree.location.coordinates,
        },
        distanceField: "distance.calculated",
        maxDistance: 100,
    },
});
const groupSumOfTreeDefaultValues = () => ({
    $group: {
        _id: null,
        treeValue: {
            $sum: {
                $ceil: {
                    $multiply: ["$diameter", "$height"],
                },
            },
        },
    },
});

exports.calculatePrice = async function (tree, userId) {
    try {
        const treeValue = Math.ceil(tree.diameter * tree.height);
        let treePrice = treeValue;

        if (tree.owner === null) {
            return treePrice;
        }
        const currentOwner = tree.owner;
        const valueTargettedPlayersTreeWithin100m = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            {
                $match: {owner: mongoose.Types.ObjectId(currentOwner)},
            },
            groupSumOfTreeDefaultValues(),
        ]);

        const amountOfTreesWithin100m = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            {$group: {_id: null, count: {$sum: 1}}},
        ]);

        const amountOfTreesTargettedPlayerWithin100m = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            {
                $match: {owner: mongoose.Types.ObjectId(currentOwner)},
            },
            {$group: {_id: null, count: {$sum: 1}}},
        ]);

        const valueOtherPeopleTreesWithin100m = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            {
                $match: {
                    $and: [
                        {
                            owner: {
                                $ne: mongoose.Types.ObjectId(currentOwner),
                            },
                        },
                        {owner: {$type: "objectId"}},
                    ],
                },
            },

            groupSumOfTreeDefaultValues(),
        ]);

        //     value of all your tree in 100m radius
        const valueOfCurrentPlayerTrees = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            {
                $match: {owner: mongoose.Types.ObjectId(userId)},
            },
            groupSumOfTreeDefaultValues(),
        ]);

        treePrice =
            treeValue +
            valueTargettedPlayersTreeWithin100m[0].treeValue *
                (amountOfTreesWithin100m[0].count /
                    amountOfTreesTargettedPlayerWithin100m[0].count) +
            valueOtherPeopleTreesWithin100m[0].treeValue -
            valueOfCurrentPlayerTrees[0].treeValue;

        return treePrice;
    } catch (error) {
        console.log(error);
    }
    return true;
};

exports.calculateLockPrice = async function (tree) {
    const treeValue = Math.ceil(tree.diameter * tree.height);

    const queryValueTrees100MeterRadius = await Tree.aggregate([
        queryGeolocTrees100MeterRadius(tree),
        groupSumOfTreeDefaultValues(),
    ]);
    const valueTrees100MeterRadius = queryValueTrees100MeterRadius[0].treeValue;

    const queryAmountPlayersAndValuePlayersTrees100MeterRadius = await Tree.aggregate(
        [
            queryGeolocTrees100MeterRadius(tree),
            {
                $match: {owner: {$ne: null}},
            },
            {
                $group: {
                    _id: null,
                    amountPlayers: {$sum: 1},
                    treeValue: {
                        $sum: {
                            $ceil: {$multiply: ["$diameter", "$height"]},
                        },
                    },
                },
            },
        ],
    );
    const amountPlayers100MeterRadius =
        queryAmountPlayersAndValuePlayersTrees100MeterRadius[0].amountPlayers;
    const valuePlayersTrees100MeterRadius =
        queryAmountPlayersAndValuePlayersTrees100MeterRadius[0].treeValue;

    const lockPrice = Math.ceil(
        treeValue * 10 +
            valueTrees100MeterRadius * amountPlayers100MeterRadius -
            valuePlayersTrees100MeterRadius / amountPlayers100MeterRadius,
    );

    return lockPrice;
};
