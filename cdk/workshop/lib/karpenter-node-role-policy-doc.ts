/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import * as iam from 'aws-cdk-lib/aws-iam';

export default function createKarpenterPolicy (
    region: string,
    partition: string,
    accountId: string,
    karpenterNodeRole: string,
    clusterName: string
): iam.PolicyDocument {
  return new iam.PolicyDocument({
    statements: [
        new iam.PolicyStatement({
        sid: 'AllowScopedEC2InstanceAccessActions',
        effect: iam.Effect.ALLOW,
        actions: ['ec2:CreateFleet', 'ec2:RunInstances'],
        resources: [
            `arn:${partition}:ec2:${region}:*:security-group/*`,
            `arn:${partition}:ec2:${region}:*:subnet/*`,
            `arn:${partition}:ec2:${region}::image/*`,
            `arn:${partition}:ec2:${region}::snapshot/*`
        ]
        }),
        new iam.PolicyStatement({
        sid: 'AllowScopedEC2LaunchTemplateAccessActions',
        effect: iam.Effect.ALLOW,
        actions: ['ec2:CreateFleet', 'ec2:RunInstances'],
        resources: [`arn:${partition}:ec2:${region}:*:launch-template/*`],
        conditions: {
            StringEquals: {
            [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned'
            },
            StringLike: {
            'aws:ResourceTag/karpenter.sh/nodepool': '*'
            }
        }
        }),
        new iam.PolicyStatement({
        sid: 'AllowScopedEC2InstanceActionsWithTags',
        effect: iam.Effect.ALLOW,
        actions: ['ec2:CreateFleet', 'ec2:CreateLaunchTemplate', 'ec2:RunInstances'],
        resources: [
            `arn:${partition}:ec2:${region}:*:fleet/*`,
            `arn:${partition}:ec2:${region}:*:instance/*`,
            `arn:${partition}:ec2:${region}:*:launch-template/*`,
            `arn:${partition}:ec2:${region}:*:network-interface/*`,
            `arn:${partition}:ec2:${region}:*:spot-instances-request/*`,
            `arn:${partition}:ec2:${region}:*:volume/*`
        ],
        conditions: {
            StringEquals: {
            [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
            'aws:RequestTag/eks:eks-cluster-name': clusterName
            },
            StringLike: {
            'aws:RequestTag/karpenter.sh/nodepool': '*'
            }
        }
        }),
        new iam.PolicyStatement({
        sid: 'AllowScopedResourceCreationTagging',
        effect: iam.Effect.ALLOW,
        actions: ['ec2:CreateTags'],
        resources: [
            `arn:${partition}:ec2:${region}:*:fleet/*`,
            `arn:${partition}:ec2:${region}:*:instance/*`,
            `arn:${partition}:ec2:${region}:*:launch-template/*`,
            `arn:${partition}:ec2:${region}:*:network-interface/*`,
            `arn:${partition}:ec2:${region}:*:spot-instances-request/*`,
            `arn:${partition}:ec2:${region}:*:volume/*`
        ],
        conditions: {
            StringEquals: {
            [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
            'aws:RequestTag/eks:eks-cluster-name': clusterName,
            'ec2:CreateAction': ['RunInstances', 'CreateFleet', 'CreateLaunchTemplate']
            },
            StringLike: {
            'aws:RequestTag/karpenter.sh/nodepool': '*'
            }
        }
        }),
        new iam.PolicyStatement({
        sid: 'AllowScopedResourceTagging',
        effect: iam.Effect.ALLOW,
        actions: ['ec2:CreateTags'],
        resources: [`arn:${partition}:ec2:${region}:*:instance/*`],
        conditions: {
            StringEquals: {
            [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned'
            },
            StringLike: {
            'aws:ResourceTag/karpenter.sh/nodepool': '*'
            },
            'ForAllValues:StringEquals': {
            'aws:TagKeys': ['eks:eks-cluster-name', 'karpenter.sh/nodeclaim', 'Name']
            },
            StringEqualsIfExists: {
            'aws:RequestTag/eks:eks-cluster-name': clusterName
            }
        }
        }),
        new iam.PolicyStatement({
        sid: 'AllowScopedDeletion',
        effect: iam.Effect.ALLOW,
        actions: ['ec2:DeleteLaunchTemplate', 'ec2:TerminateInstances'],
        resources: [`arn:${partition}:ec2:${region}:*:instance/*`, `arn:${partition}:ec2:${region}:*:launch-template/*`],
        conditions: {
            StringEquals: {
            [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned'
            },
            StringLike: {
            'aws:ResourceTag/karpenter.sh/nodepool': '*'
            }
        }
        }),
        new iam.PolicyStatement({
        sid: 'AllowRegionalReadActions',
        effect: iam.Effect.ALLOW,
        actions: [
            'ec2:DescribeImages',
            'ec2:DescribeInstanceTypeOfferings',
            'ec2:DescribeInstanceTypes',
            'ec2:DescribeInstances',
            'ec2:DescribeLaunchTemplates',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeSpotPriceHistory',
            'ec2:DescribeSubnets'
        ],
        resources: ['*'],
        conditions: {
            StringEquals: {
            'aws:RequestedRegion': `${region}`
            }
        }
        }),
        new iam.PolicyStatement({
        sid: 'AllowSSMReadActions',
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: [`arn:${partition}:ssm:${region}::parameter/aws/service/*`]
        }),
        new iam.PolicyStatement({
        sid: 'AllowPricingReadActions',
        effect: iam.Effect.ALLOW,
        actions: ['pricing:GetProducts'],
        resources: ['*']
        }),
        new iam.PolicyStatement({
        sid: 'AllowPassingInstanceRole',
        effect: iam.Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: [`arn:${partition}:iam::${accountId}:role/${karpenterNodeRole}`],
        conditions: {
            StringEquals: {
            'iam:PassedToService': ['ec2.amazonaws.com', 'ec2.amazonaws.com.cn']
            }
        }
        }),
        new iam.PolicyStatement({
        sid: 'AllowScopedInstanceProfileCreationActions',
        effect: iam.Effect.ALLOW,
        actions: ['iam:CreateInstanceProfile'],
        resources: [`arn:${partition}:iam::${accountId}:instance-profile/*`],
        conditions: {
            StringEquals: {
            [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
            'aws:RequestTag/eks:eks-cluster-name': clusterName,
            [`aws:RequestTag/topology.kubernetes.io/region`]: `${region}`
            },
            StringLike: {
            'aws:RequestTag/karpenter.k8s.aws/ec2nodeclass': '*'
            }
        }
        }),
        new iam.PolicyStatement({
        sid: 'AllowScopedInstanceProfileTagActions',
        effect: iam.Effect.ALLOW,
        actions: ['iam:TagInstanceProfile'],
        resources: [`arn:${partition}:iam::${accountId}:instance-profile/*`],
        conditions: {
            StringEquals: {
            [`aws:ResourceTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
            [`aws:ResourceTag/topology.kubernetes.io/region`]: `${region}`,
            [`aws:RequestTag/kubernetes.io/cluster/${clusterName}`]: 'owned',
            'aws:RequestTag/eks:eks-cluster-name': clusterName,
            [`aws:RequestTag/topology.kubernetes.io/region`]: `${region}`
            },
            StringLike: {
            'aws:ResourceTag/karpenter.k8s.aws/ec2nodeclass': '*',
            'aws:RequestTag/karpenter.k8s.aws/ec2nodeclass': '*'
            }
        }
        }),
        new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            'sqs:DeleteMessage',
            'sqs:GetQueueAttributes',
            'sqs:GetQueueUrl',
            'sqs:ReceiveMessage'
        ],
        resources: [`arn:${partition}:sqs:${region}:${accountId}:${clusterName}`]
        })
    ]
    });
}
