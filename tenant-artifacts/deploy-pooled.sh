STACKS=$(aws cloudformation describe-stacks)
USERPOOLID=$(echo $STACKS | jq -r '.Stacks[]?.Outputs[]? | select(.OutputKey=="PooledTenantUserPoolId") | .OutputValue')
APPCLIENTID=$(echo $STACKS | jq -r '.Stacks[]?.Outputs[]? | select(.OutputKey=="PooledTenantAppClientId") | .OutputValue')
REGION=$(aws configure get region)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --region $REGION |jq -r ".Account")
ELBURL=$(kubectl get svc -l istio=ingress -n istio-ingress -o json | jq -r '.items[0].status.loadBalancer.ingress[0].hostname')
IAM_ROLE_ARN=$(echo $STACKS | jq -r '.Stacks[]?.Outputs[]? | select(.OutputKey=="RoleUsedByTVM") | .OutputValue')
PRODUCTTABLE=$(echo $STACKS | jq -r '.Stacks[]?.Outputs[]? | select(.OutputKey=="ProductTable") | .OutputValue')
ORDERTABLE=$(echo $STACKS | jq -r '.Stacks[]?.Outputs[]? | select(.OutputKey=="OrderTable") | .OutputValue')

TMPFILE=`mktemp /tmp/$0.XXXXXX` || exit 1
cat <<EOF >> $TMPFILE
region: $REGION
cognito:
  userPoolId: $USERPOOLID
  clientId: $APPCLIENTID
loadBalancerAddress: $ELBURL
app:
  tenantPath: app
  iamRoleArn: $IAM_ROLE_ARN
  
  product:
    image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/aws-workshop/eks-saas-product
    productTable: $PRODUCTTABLE
    port: 80
    targetPort: 3005
    
  order:
    image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/aws-workshop/eks-saas-order:v1
    orderTable: $ORDERTABLE
    port: 80
    targetPort: 3010
  
  application:
    image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/aws-workshop/eks-saas-application
    port: 80
    targetPort: 80
EOF

cat $TMPFILE

helm install -f $TMPFILE pooled ./helm/standard-tier-chart -n pooled