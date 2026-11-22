cd /home/user/tetsing/video/src/breakdown/data
{ for f in *.json; do n=$(echo ${f%.json} | tr -c 'a-zA-Z0-9\n' '_'); echo "import d_$n from \"./$f\";"; done
  echo -n "export const breakdowns: any[] = ["; for f in *.json; do n=$(echo ${f%.json} | tr -c 'a-zA-Z0-9\n' '_'); echo -n "d_$n, "; done; echo "];"; } > index.ts
cat index.ts
