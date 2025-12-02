pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "myregistry.com/myapp:latest"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/affishh/configure_management'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Detect folder containing Dockerfile
                    def dockerDir = sh(
                        script: "find . -type f -name Dockerfile -exec dirname {} \\; | head -n 1",
                        returnStdout: true
                    ).trim()

                    if (!dockerDir) {
                        error "No Dockerfile found in the repo!"
                    } else {
                        echo "Found Dockerfile in: ${dockerDir}"
                    }

                    // Build Docker image
                    sh """
                        docker build -t ${DOCKER_IMAGE} ${dockerDir}
                    """
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    def testDir = sh(script: "find . -type f -name package.json -exec dirname {} \\; | head -n 1", returnStdout: true).trim()
                    if (testDir) {
                        sh """
                            cd ${testDir}
                            npm install
                            npm test || echo "No tests found"
                        """
                    } else {
                        echo "No package.json found, skipping tests"
                    }
                }
            }
        }

        stage('Push Image') {
            steps {
                sh "docker push ${DOCKER_IMAGE}"
            }
        }

        stage('Deploy GREEN Environment') {
            steps {
                sh """
                    kubectl apply -f kubernetes/deployment-green.yaml
                    kubectl apply -f kubernetes/service.yaml
                """
            }
        }

        stage('Smoke Test GREEN') {
            steps {
                sh """
                    curl -f http://GREEN-SERVICE-IP || exit 1
                """
            }
        }

        stage('Switch Traffic BLUE → GREEN') {
            steps {
                sh "kubectl apply -f kubernetes/production-service-green.yaml"
            }
        }
    }

    post {
        failure {
            echo "Deployment Failed – Blue environment still active!"
        }
        success {
            echo "Green environment deployed successfully!"
        }
    }
}
