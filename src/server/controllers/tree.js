const Tree = require("../models/tree");
const User = require("../models/user");
const helpers = require("../helpers/index");
import {getTreeValue} from "../helpers/index";

const queryGeolocTrees100MeterRadius = (tree) => ({
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

exports.getAllTrees = (req, res) => {
    Tree.find()
        .then((tree) => res.status(200).json(tree))
        .catch((error) => res.status(404).json({error}));
};

exports.setRandomTrees = (req, res) => {
    User.findOne({_id: req.userId})
        .then((user) => {
            if (!user) {
                return res.status(401).json({error: "User not found"});
            }

            Tree.aggregate([{$match: {owner: null}}, {$sample: {size: 3}}])
                .then((trees) => {
                    for (const tree of trees) {
                        Tree.updateOne({_id: tree._id}, {owner: user._id})
                            .then(() =>
                                res.json({message: "Random trees generated"}),
                            )
                            .catch((error) => res.status(404).json({error}));
                    }
                    return true;
                })
                .catch((error) => res.status(404).json({error}));
            return true;
        })
        .catch((error) => res.status(404).json({error}));
    return true;
};

exports.lockTree = async (req, res) => {
    try {
        const user = await User.findOne({_id: req.userId});
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        const tree = await Tree.findOne({_id: req.params.treeId});
        if (!tree) {
            return res.status(404).json({error: "Tree not found"});
        }

        const isTreeBelongToUser =
            user._id.toString() === tree.owner.toString() ? true : false;
        if (!isTreeBelongToUser) {
            return res.status(403).json({
                error: "The tree does not belong to this user",
            });
        }

        if (tree.isLocked) {
            return res.status(403).json({
                error: "The tree is already locked",
            });
        }

        const treeValue = helpers.getTreeValue(tree);

        const queryValueTrees100MeterRadius = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            groupSumOfTreeDefaultValues(),
        ]);
        const valueTrees100MeterRadius =
            queryValueTrees100MeterRadius[0].treeValue;

        const queryAmountPlayersAndValuePlayersTrees100MeterRadius = await Tree.aggregate(
            [
                queryGeolocTrees100MeterRadius(tree),
                {
                    $match: {owner: {$ne: null}},
                },
                groupSumOfTreeDefaultValues(),
            ],
        );
        const amountPlayers100MeterRadius =
            queryAmountPlayersAndValuePlayersTrees100MeterRadius[0]
                .amountPlayers;
        const valuePlayersTrees100MeterRadius =
            queryAmountPlayersAndValuePlayersTrees100MeterRadius[0].treeValue;

        const leavesToPay =
            treeValue * 10 +
            valueTrees100MeterRadius * amountPlayers100MeterRadius -
            valuePlayersTrees100MeterRadius / amountPlayers100MeterRadius;

        const isPlayerHaveEnoughLeavesToBuy =
            user.leaves >= leavesToPay ? true : false;
        if (!isPlayerHaveEnoughLeavesToBuy) {
            return res.status(401).json({
                error: "The user doesn't have enough leaves to buy this tree",
            });
        }

        await Tree.updateOne({_id: tree._id}, {isLocked: true});

        await User.updateOne(
            {_id: user._id},
            {leaves: user.leaves - leavesToPay},
        );
    } catch (error) {
        res.status(500).json({error});
    }

    return true;
};

exports.buyOne = async (req, res) => {
    const treeId = req.params.id;
    const userId = req.userId;
    // get user data

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }

        const tree = await Tree.findById(treeId);
        if (!tree) {
            return res.status(404).json({error: "tree not found"});
        }

        const currentOwner = tree.owner;

        let treeValue = 0;

        // Calcul du prix

        //value of all the targetted player's trees in 100m radius

        const valueTargettedPlayersTreeWithin100m = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            {
                $match: {owner: {currentOwner}},
            },
            groupSumOfTreeDefaultValues(),
        ]);

        // [amount of trees in 100m radius]

        const amountOfTreesWithin100m = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            {$group: {_id: null, count: {$sum: 1}}},
        ]);

        //[amount of tree of targetted player in 100m radius]))

        const amountOfTreesTargettedPlayerWithin100m = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            {
                $match: {owner: {currentOwner}},
            },
            {$group: {_id: null, count: {$sum: 1}}},
        ]);

        // Value of all the other players trees in 100m radius

        const valueOtherPeopleTreesWithin100m = await Tree.aggregate([
            queryGeolocTrees100MeterRadius(tree),
            {
                $match: {
                    $and: [
                        {owner: {$ne: currentOwner}},
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
                $match: {owner: {userId}},
            },
            groupSumOfTreeDefaultValues(),
        ]);

        if (currentOwner === null) {
            treeValue = tree.diameter * tree.height;

            console.log("current owner is null");
            console.log("default tree value applied : " + treeValue);
        } else {


            // console.log(valueTargettedPlayersTreeWithin100m[0].treeValue );
            
            
            // treeValue =
            //     getTreeValue(tree) +
            //     valueTargettedPlayersTreeWithin100m[0].treeValue *
            //         (amountOfTreesWithin100m[0].count /
            //             amountOfTreesTargettedPlayerWithin100m[0].count) +
            //     valueOtherPeopleTreesWithin100m[0].treeValue -
            //     valueOfCurrentPlayerTrees[0].treeValue;

            //     (amountOfTreesWithin100m[0].count /
            //         amountOfTreesTargettedPlayerWithin100m[0].count) +
            // valueOtherPeopleTreesWithin100m[0].treeValue -
            // valueOfCurrentPlayerTrees[0].treeValue;

            //  [value of the targetted tree] + ([value of all the targetted player's trees in 100m radius] × ([amount of trees in 100m radius] / [amount of tree of targetted player in 100m radius])) + [value of all the other players trees in 100m radius] - [value of all your tree in 100m radius].

            console.log("tree owned previously");
            console.log("treeValue : " + treeValue);
        }

        if (
            user.leaves > treeValue &&
            tree.owner !== user._id /*&& tree.isLocked == false*/
        ) {
            Tree.updateOne(
                {_id: treeId},
                {
                    color: user.color,
                    owner: user._id,
                },
            )
                .then(() => res.status(201).json())
                .catch((error) => res.status(404).json(error));

            User.updateOne(
                {_id: userId},
                {
                    leaves: Math.ceil(user.leaves - treeValue),
                },
            )
                .then(() => res.status(201).json())
                .catch((error) => res.status(404).json(error));
        } else {
            console.log(
                "Can't buy this tree : not enough leaves or is lock or you already own it",
            );
        }
    } catch (error) {
        res.status(500).json({error});

        console.log(error);
    }
};
