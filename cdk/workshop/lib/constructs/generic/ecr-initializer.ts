import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export interface EcrRepositoriesProps {
  repositoryNames: string[];
}

export class EcrRepositories extends Construct {
  constructor(scope: Construct, id: string, props: EcrRepositoriesProps) {
    super(scope, id);

    // Create ECR repositories from provided names
    props.repositoryNames.forEach((repoName, index) => {
      new ecr.Repository(this, `Repository${index + 1}`, {
        repositoryName: repoName,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        imageScanOnPush: false
      });
    });
  }
} 
