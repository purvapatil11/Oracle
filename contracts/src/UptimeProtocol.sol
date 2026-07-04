// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UptimeProtocol {
    
    enum ReportStatus { Pending, Disputed, ResolvedUp, ResolvedDown }

    struct Website {
        string url;
        address owner;
        uint256 balancePool;
        bool isActive;
    }

    struct Report {
        uint256 id;
        uint256 websiteId;
        string region;
        address reporter;
        uint256 reporterStake;
        bool reportedIsUp; // true = site is up, false = site is down
        uint256 timestamp;
        ReportStatus status;
        address challenger;
        uint256 challengerStake;
        uint256 upVotes;
        uint256 downVotes;
    }

    uint256 public websiteCount;
    uint256 public reportCount;
    
    uint256 public constant MIN_STAKE = 0.01 ether; // Adjusted easily for Monad testnet gas/pennies
    uint256 public constant DISPUTE_WINDOW = 3 minutes; // Fast windows for hackathon presentation

    mapping(uint256 => Website) public websites;
    mapping(uint256 => Report) public reports;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // Events for frontend tracking
    event WebsiteRegistered(uint256 indexed websiteId, string url, address indexed owner);
    event UptimeReported(uint256 indexed reportId, uint256 indexed websiteId, address indexed reporter, bool isUp);
    event ReportDisputed(uint256 indexed reportId, address indexed challenger);
    event VoteCasted(uint256 indexed reportId, address indexed voter, bool voteUp);
    event ReportSettled(uint256 indexed reportId, ReportStatus finalStatus);

    modifier onlyOwner(uint256 _websiteId) {
        require(websites[_websiteId].owner == msg.sender, "Not the website owner");
        _;
    }

    /// @notice Website owners register their site and fund the uptime monitoring reward pool
    function registerWebsite(string memory _url) external payable {
        require(msg.value > 0, "Must fund the reward pool");
        
        websiteCount++;
        websites[websiteCount] = Website({
            url: _url,
            owner: msg.sender,
            balancePool: msg.value,
            isActive: true
        });

        emit WebsiteRegistered(websiteCount, _url, msg.sender);
    }

    /// @notice Regional nodes report the uptime status of a website by staking "skin in the game"
    function reportUptime(uint256 _websiteId, string memory _region, bool _isUp) external payable {
        require(websites[_websiteId].isActive, "Website monitoring not active");
        require(msg.value >= MIN_STAKE, "Insufficient reporter stake");

        reportCount++;
        reports[reportCount] = Report({
            id: reportCount,
            websiteId: _websiteId,
            region: _region,
            reporter: msg.sender,
            reporterStake: msg.value,
            reportedIsUp: _isUp,
            timestamp: block.timestamp,
            status: ReportStatus.Pending,
            challenger: address(0),
            challengerStake: 0,
            upVotes: 0,
            downVotes: 0
        });

        emit UptimeReported(reportCount, _websiteId, msg.sender, _isUp);
    }

    /// @notice Anyone can dispute a pending report within the window by matching the stake
    function disputeReport(uint256 _reportId) external payable {
        Report storage report = reports[_reportId];
        require(report.status == ReportStatus.Pending, "Report not open for dispute");
        require(block.timestamp <= report.timestamp + DISPUTE_WINDOW, "Dispute window closed");
        require(msg.value >= report.reporterStake, "Must match reporter stake to challenge");

        report.challenger = msg.sender;
        report.challengerStake = msg.value;
        report.status = ReportStatus.Disputed;

        emit ReportDisputed(_reportId, msg.sender);
    }

    /// @notice Public community curates and votes on disputed reports
    function voteOnDispute(uint256 _reportId, bool _voteUp) external {
        Report storage report = reports[_reportId];
        require(report.status == ReportStatus.Disputed, "Report is not under active dispute");
        require(!hasVoted[_reportId][msg.sender], "Already voted on this dispute");

        hasVoted[_reportId][msg.sender] = true;

        if (_voteUp) {
            report.upVotes++;
        } else {
            report.downVotes++;
        }

        emit VoteCasted(_reportId, msg.sender, _voteUp);
    }

    /// @notice Resolves the report and distributes funds after the dispute/voting phase ends
    function settleReport(uint256 _reportId) external {
        Report storage report = reports[_reportId];
        Website storage website = websites[report.websiteId];
        
        if (report.status == ReportStatus.Pending) {
            // Optimistic path: No one disputed within the timeframe. Reporter wins base reward + stake back.
            require(block.timestamp > report.timestamp + DISPUTE_WINDOW, "Dispute window still active");
            
            report.status = report.reportedIsUp ? ReportStatus.ResolvedUp : ReportStatus.ResolvedDown;
            
            uint256 reward = 0.005 ether; // Fixed base payout per successful un-disputed report
            if (website.balancePool >= reward) {
                website.balancePool -= reward;
                payable(report.reporter).transfer(report.reporterStake + reward);
            } else {
                payable(report.reporter).transfer(report.reporterStake);
            }

        } else if (report.status == ReportStatus.Disputed) {
            // Disputed path: Handled via community vote outcomes
            // For hackathon purposes, settleable once votes are cast or manual trigger for presentation
            uint256 totalPool = report.reporterStake + report.challengerStake;
            
            if (report.upVotes >= report.downVotes) {
                // Community agreed the site was UP.
                report.status = ReportStatus.ResolvedUp;
                
                // If reporter said it was UP, reporter wins the challenger's stake
                if (report.reportedIsUp) {
                    payable(report.reporter).transfer(totalPool);
                } else {
                    // Reporter lied saying it was down. Challenger wins.
                    payable(report.challenger).transfer(totalPool);
                }
            } else {
                // Community agreed the site was DOWN.
                report.status = ReportStatus.ResolvedDown;
                
                // If reporter said it was DOWN, reporter wins
                if (!report.reportedIsUp) {
                    payable(report.reporter).transfer(totalPool);
                } else {
                    // Reporter lied saying it was up. Challenger wins.
                    payable(report.challenger).transfer(totalPool);
                }
            }
        } else {
            revert("Report already settled");
        }

        emit ReportSettled(_reportId, report.status);
    }
}