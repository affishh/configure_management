pipeline {
    agent any

    environment {
        IMAGE_NAME = 'myapp'
        IMAGE_TAG = 'latest'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def dockerfileDir = sh(
                        script: "find . -type f -name Dockerfile -exec dirname {} \\; | head -n 1",
                        returnStdout: true
                    ).trim()
                    echo "Found Dockerfile in: ${dockerfileDir}"

                    sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} ${dockerfileDir}"
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    sh "npm install"
                    sh "npm test"
                }
            }
        }

        stage('Push Image') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                        sh "docker tag ${IMAGE_NAME}:${IMAGE_TAG} $DOCKER_USER/${IMAGE_NAME}:${IMAGE_TAG}"
                        sh "docker push $DOCKER_USER/${IMAGE_NAME}:${IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Deploy Green') {
            steps {
                script {
                    // Stop old green container if exists
                    sh "docker rm -f myapp-green || true"
                    
                    // Run new version as green
                    sh "docker run -d --name myapp-green -p 4000:80 $DOCKER_USER/${IMAGE_NAME}:${IMAGE_TAG}"
                }
            }
        }

        stage('Test Green') {
            steps {
                script {
                    // Simple health check
                    sh "curl -f http://localhost:4000 || exit 1"
                }
            }
        }

        stage('Switch Traffic to Green') {
            steps {
                script {
                    // Stop old blue container if exists
                    sh "docker rm -f myapp-blue || true"

                    // Rename green to blue for next deployment
                    sh "docker rename myapp-green myapp-blue"

                    echo "Blue-Green deployment complete. Traffic switched to new version!"
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
            sh "docker logout"
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check logs for details.'
        }
    }
}
