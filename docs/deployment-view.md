# Deployment View

This document focuses specifically on how the virtual calling architecture can be deployed in a real environment.

## Deployment model

The system should be split into independent layers:

- edge layer for traffic control and protection
- app layer for business logic and API processing
- media layer for real-time traffic
- data layer for persistence and queue processing

## Deployment diagram

```mermaid
flowchart TB
    subgraph Edge
        U[Clients]
        LB[Load Balancer]
        WAF[WAF / DDoS]
    end

    subgraph App
        G[API Gateway]
        A[Auth Service]
        C[Call Control]
        P[Presence Service]
        N[Notification Service]
    end

    subgraph Media
        ST[Signal Gateway]
        MS[Media Server]
    end

    subgraph Data
        DB[(DB)]
        REDIS[(Redis)]
        MQ[(Queue)]
    end

    subgraph Ops
        LOG[Logs]
        MET[Metrics]
        TR[Tracing]
    end

    U --> LB
    LB --> WAF
    WAF --> G
    G --> A
    G --> C
    G --> P
    C --> MS
    C --> MQ
    P --> REDIS
    N --> MQ
    ST --> MS
    C --> DB
    G --> MET
    C --> LOG
    MS --> TR
    DB --> LOG
    REDIS --> MET
    MQ --> LOG
```

## Operational recommendations

- run API services behind autoscaling groups or Kubernetes deployments
- keep websocket or signaling traffic separate from large media streams
- coordinate media scaling based on CPU, packet loss, and jitter
- use health checks and rolling deploys for safer runtime changes
- maintain data backups and queue replay for fault tolerance

## Production concerns

- secure APIs and signaling channels with identity checks
- isolate call state and media path from non-call workloads
- monitor call quality metrics continuously
- add retries for notification and webhook delivery
- preserve audit records for support investigations
