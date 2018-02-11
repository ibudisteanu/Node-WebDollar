import NodesList from 'node/lists/nodes-list';
import PoolData from 'common/blockchain/interface-blockchain/mining-pools/pool-management/PoolData';

import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward';

const BigNumber = require('bignumber.js');
const BigInteger = require('big-integer');

class PoolLeaderProtocol {

    constructor(dataBase) {

        NodesList.emitter.on("nodes-list/connected", (result) => {
            this._subscribeMiner(result)
        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {
            this._unsubscribeMiner(result)
        });

        // this.blockchainReward = BlockchainMiningReward.getReward();
        this.difficultyTarget = new Buffer("00978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb", "hex"); //target difficulty;

        this.poolData = new PoolData(dataBase);

        //TODO: Check is needed to store/load from database
        this.reward = new BigNumber(0);
    }

    _subscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;

        socket.node.sendRequest("mining-pool-protocol/create-minner-task", (data) => {

            try {
                this.createMinerTask();
            } catch (exception) {

                console.log("Failed to send task to minner");
            }

        });

        socket.node.on("mining-pool-protocol/get-minner-work", (data) => {

            let higherHash = this.getHigherHashDifficulty(data);

            this.poolHigherHashesList(higherHash, data.address);
        });

    }

    _unsubscribeMiner(nodesListObject) {

        let socket = nodesListObject.socket;
    }

    createMinerTask() {

        //To create miner task puzzle

    }

    poolHigherHashesList(hash, minerAddress) {

        let higherHashList;

    }

    setMinnersRewardPrecentage() {


    }

    /**
     * Calculate difficulty for all hashes
     * @param target
     * @param hashList is the list of best hashes from all miners
     * @returns {*}
     */
    generateHashDifficulties(target, hashList) {

        let hashTargetNumber = new BigInteger(target.toString('hex'), 16);

        for (let i = 0; i < hashList.length; ++i) {

            let currentHash = new BigInteger(hashList[i].hash.toString('hex'), 16);

            hashList[i].difficulty = new BigNumber(hashTargetNumber).dividedBy(currentHash).toString();

        }

        return hashList;

    }

    /**
     * Computes the reward for miners. This function must be called at every block reward
     * @param reward is the total new reward of the pool
     * @param minersFee is the fee which will be weighted distributed to pool miners.
     * @returns {{poolLeaderReward: string, minnersReward: *}}
     */
    rewardsDistribution(reward, minersFee) {

        let leaderReward = reward.mul(minersFee).dividedBy(100);
        this.reward = this.reward.plus(leaderReward);

        let minersReward =  reward.minus(leaderReward);

        // Create hash difficulties list from all minners best hasses
        let hashList = this.generateHashDifficulties(this.hashTarget, hashList);

        // Calculate total of Difficulties list
        let totalDifficulties =  new BigNumber(0);
        for (let i = 0; i < hashList.length; i++){

            totalDifficulties = totalDifficulties.plus(hashList[i].difficulty);

        }

        // Add to hashList rewards for each minner
        for (let i = 0; i < hashList.length; i++){

            let currentDifficultyPercent = new BigNumber (hashList[i].difficulty).dividedBy(totalDifficulties).mul(100);

            let currentMinerReward = new BigNumber(currentDifficultyPercent).dividedBy(100).mul(minnersReward);

            hashList[i].reward = currentMinerReward.toString();

        }

        return {
            poolLeaderReward: poolLeaderReward.toString(),
            minnersReward: hashList
        }

    }

    // Budisteanu's formula
    getMinerReward(bestHash, hashTarget, reward, numberHashedLastTime) {

        bestHash = new BigInteger(bestHash.toString('hex'), 16);
        hashTarget = new BigInteger(hashTarget.toString('hex'), 16);

        let difficulty = new BigNumber(bestHash).dividedBy(hashTarget);
        let rewardForHashes = new BigNumber(reward).dividedBy(numberHashedLastTime);
        let result = new BigNumber(difficulty).mul(rewardForHashes);

        return result.toString();

    }

    getPoolRewardFromBlockchain(reward) {

        let poolLeaderFee = this.getPoolLeaderFee();
        let newRewardDistribution = this.rewardsDistribution(reward, poolLeaderFee, hashList);

        this.poolData.updateMinersReward(newRewardDistribution.minnersReward);

        //To add pool leader reward

    }

    getPoolLeaderFee() {
        return this._poolLeaderFee;
    }

    setPoolLeaderFee(fee) {
        this._poolLeaderFee = fee;
    }

}

export default PoolLeaderProtocol;